import { google } from "googleapis";

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
}

export interface ClassroomTask {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  link?: string;
}

export interface ClassroomData {
  course: ClassroomCourse;
  tasks: ClassroomTask[];
}

export async function fetchClassroomData(accessToken: string): Promise<ClassroomData[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const classroom = google.classroom({ version: "v1", auth: oauth2Client });

  try {
    // 1. Buscar turmas ativas onde o usuário está matriculado ou ensina
    const coursesRes = await classroom.courses.list({
      courseStates: ["ACTIVE"],
    });

    const courses = coursesRes.data.courses || [];
    const result: ClassroomData[] = [];

    // 2. Para cada turma, buscar atividades
    for (const course of courses) {
      if (!course.id || !course.name) continue;

      const mappedCourse: ClassroomCourse = {
        id: course.id,
        name: course.name,
        section: course.section || undefined,
        descriptionHeading: course.descriptionHeading || undefined,
      };

      const tasks: ClassroomTask[] = [];

      try {
        const courseWorkRes = await classroom.courses.courseWork.list({
          courseId: course.id,
        });

        const courseworkList = courseWorkRes.data.courseWork || [];

        for (const cw of courseworkList) {
          if (!cw.id || !cw.title) continue;

          // Processar data de vencimento
          let dueDate = new Date();
          if (cw.dueDate) {
            const year = cw.dueDate.year || new Date().getFullYear();
            const month = cw.dueDate.month ? cw.dueDate.month - 1 : 0; // 0-indexed no JS
            const day = cw.dueDate.day || 1;
            const hours = cw.dueTime?.hours || 23;
            const minutes = cw.dueTime?.minutes || 59;
            dueDate = new Date(year, month, day, hours, minutes);
          } else if (cw.creationTime) {
            // Fallback se não houver data de vencimento
            dueDate = new Date(cw.creationTime);
          }

          tasks.push({
            id: cw.id,
            title: cw.title,
            description: cw.description || undefined,
            dueDate,
            link: cw.alternateLink || undefined,
          });
        }
      } catch (err) {
        // Ignora falhas em turmas individuais (ex: se não houver permissão de coursework nelas)
        console.error(`Erro ao buscar atividades da turma ${course.name}:`, err);
      }

      result.push({
        course: mappedCourse,
        tasks,
      });
    }

    return result;
  } catch (error) {
    console.error("Erro ao buscar dados do Google Classroom:", error);
    throw error;
  }
}
