"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { fetchClassroomData } from "@/services/classroom.service";
import { revalidatePath } from "next/cache";

export async function syncClassroomData() {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error("Sua sessão não possui credenciais do Google ou expirou. Por favor, faça login novamente.");
  }
  
  if (!session?.user?.id) {
    throw new Error("Usuário não identificado.");
  }

  try {
    const classroomData = await fetchClassroomData(session.accessToken);
    let subjectsCreated = 0;
    let tasksCreated = 0;

    for (const item of classroomData) {
      const { course, tasks } = item;

      // 1. Sincronizar a Matéria (Subject) baseando-se no googleId
      const subject = await prisma.subject.upsert({
        where: { googleId: course.id },
        update: {
          name: course.name,
        },
        create: {
          googleId: course.id,
          name: course.name,
          userId: session.user.id,
          color: "#4285F4", // Cor padrão da marca Google
        },
      });
      subjectsCreated++;

      // 2. Sincronizar cada Atividade (Task) desta turma
      for (const t of tasks) {
        const task = await prisma.task.upsert({
          where: { googleId: t.id },
          update: {
            title: t.title,
            description: t.description || null,
            dueDate: t.dueDate,
          },
          create: {
            googleId: t.id,
            title: t.title,
            description: t.description || null,
            dueDate: t.dueDate,
            subjectId: subject.id,
            isCompleted: false,
          },
        });
        tasksCreated++;

        // 3. Adicionar link do Google Classroom como anexo
        if (t.link) {
          const existingAttachment = await prisma.attachment.findFirst({
            where: { taskId: task.id, url: t.link },
          });

          if (!existingAttachment) {
            await prisma.attachment.create({
              data: {
                name: "Google Classroom",
                url: t.link,
                type: "LINK",
                taskId: task.id,
              },
            });
          }
        }
      }
    }

    revalidatePath("/studies");
    revalidatePath("/");
    
    return {
      success: true,
      subjectsCount: subjectsCreated,
      tasksCount: tasksCreated,
    };
  } catch (error: any) {
    console.error("Erro na Server Action syncClassroomData:", error);
    throw new Error(error.message || "Falha ao sincronizar dados com o Classroom.");
  }
}
