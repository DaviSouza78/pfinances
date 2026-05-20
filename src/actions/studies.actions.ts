"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createSubject(data: { name: string; color?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");

    await prisma.subject.create({
      data: {
        ...data,
        userId: session.user.id
      }
    });

    revalidatePath('/studies');
  } catch (error) {
    console.error("Failed to create subject:", error);
    throw new Error("Falha ao criar matéria.");
  }
}

export async function getSubjects() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.subject.findMany({
      where: { userId: session.user.id },
      include: {
        tasks: {
          include: {
            attachments: true
          },
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return [];
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  startDate?: Date;
  dueDate: Date;
  subjectId: string;
  attachments?: { name: string; url: string; type: "FILE" | "LINK" }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");

    const { attachments, ...taskData } = data;

    await prisma.task.create({
      data: {
        ...taskData,
        attachments: {
          create: attachments || []
        }
      }
    });

    revalidatePath('/studies');
    revalidatePath('/'); // For dashboard upcoming tasks
  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error("Falha ao criar atividade.");
  }
}

export async function getUpcomingTasks() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.task.findMany({
      where: {
        subject: { userId: session.user.id },
        isCompleted: false,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        subject: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch upcoming tasks:", error);
    return [];
  }
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");

    // Verificar se a task pertence ao usuário
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        subject: { userId: session.user.id }
      }
    });

    if (!task) throw new Error("Atividade não encontrada");

    await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted }
    });

    revalidatePath('/studies');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to toggle task completion:", error);
    throw new Error("Falha ao atualizar atividade.");
  }
}
