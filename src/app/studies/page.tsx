import { getSubjects } from "@/actions/studies.actions";
import { StudiesClient } from "@/components/studies/StudiesClient";

export const dynamic = 'force-dynamic';

export default async function StudiesPage() {
  const subjects = await getSubjects();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full flex flex-col">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Estudos</h2>
        <p className="text-muted-foreground">
          Gestão de matérias, atividades e anexos
        </p>
      </div>

      <StudiesClient initialSubjects={subjects} />
    </div>
  );
}
