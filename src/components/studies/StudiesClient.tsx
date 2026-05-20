"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectForm } from "./SubjectForm";
import { TaskForm } from "./TaskForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { syncClassroomData } from "@/actions/classroom.actions";
import { toggleTaskCompletion } from "@/actions/studies.actions";

type TaskFilter = "pending" | "completed";

export function StudiesClient({ initialSubjects }: { initialSubjects: any[] }) {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("pending");
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    initialSubjects.length > 0 ? initialSubjects[0].id : null
  );

  const selectedSubject = initialSubjects.find(s => s.id === selectedSubjectId);

  // Filtrar tasks com base no filtro selecionado
  const filteredTasks = useMemo(() => {
    if (!selectedSubject?.tasks) return [];
    return selectedSubject.tasks.filter((task: any) => 
      taskFilter === "completed" ? task.isCompleted : !task.isCompleted
    );
  }, [selectedSubject, taskFilter]);

  // Contagem de tasks por status
  const taskCounts = useMemo(() => {
    if (!selectedSubject?.tasks) return { pending: 0, completed: 0 };
    return {
      pending: selectedSubject.tasks.filter((t: any) => !t.isCompleted).length,
      completed: selectedSubject.tasks.filter((t: any) => t.isCompleted).length,
    };
  }, [selectedSubject]);

  const handleSubjectCreated = () => {
    window.location.reload(); 
  };

  const handleTaskCreated = () => {
    window.location.reload();
  };

  const handleSyncClassroom = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncClassroomData();
      setSyncResult(`Sincronizado: ${res.subjectsCount} matérias e ${res.tasksCount} tarefas!`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setSyncResult(err.message || "Falha na sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTogglingTaskId(taskId);
    try {
      await toggleTaskCompletion(taskId, !currentStatus);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-[500px]">
      {/* Sidebar de Matérias */}
      <div className="col-span-1 border rounded-lg p-4 bg-card flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Matérias</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsAddingSubject(!isAddingSubject)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mb-4 gap-2 border-dashed border-blue-500/50 hover:bg-blue-950/20 text-xs py-1.5"
          onClick={handleSyncClassroom}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("h-3 w-3 text-blue-500", isSyncing && "animate-spin")} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Google Classroom"}
        </Button>
        {syncResult && (
          <p className="text-[10px] text-center text-blue-400 mb-4 bg-blue-950/30 p-1.5 rounded border border-blue-900/50">
            {syncResult}
          </p>
        )}

        {isAddingSubject && (
          <div className="mb-4">
            <SubjectForm onSuccess={handleSubjectCreated} onCancel={() => setIsAddingSubject(false)} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1">
          {initialSubjects.length === 0 && !isAddingSubject && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma matéria cadastrada.</p>
          )}
          {initialSubjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                selectedSubjectId === sub.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{sub.name}</span>
              </div>
              {selectedSubjectId === sub.id && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel de Atividades */}
      <div className="col-span-1 md:col-span-3 border rounded-lg p-6 bg-card flex flex-col">
        {!selectedSubject ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma matéria para visualizar suas atividades.
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold">{selectedSubject.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSubject.tasks?.length || 0} atividades registradas</p>
              </div>
              <Button onClick={() => setIsAddingTask(!isAddingTask)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </div>

            {/* Toggle Entregues / Não Entregues */}
            <div className="flex items-center gap-1 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setTaskFilter("pending")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  taskFilter === "pending"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <Circle className="h-3.5 w-3.5" />
                  Pendentes
                  {taskCounts.pending > 0 && (
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {taskCounts.pending}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setTaskFilter("completed")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  taskFilter === "completed"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Entregues
                  {taskCounts.completed > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {taskCounts.completed}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {isAddingTask && (
              <div className="mb-6">
                <TaskForm 
                  subjectId={selectedSubject.id} 
                  onSuccess={handleTaskCreated} 
                  onCancel={() => setIsAddingTask(false)} 
                />
              </div>
            )}

            <div className="space-y-4">
              {filteredTasks.length === 0 && !isAddingTask && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>
                    {taskFilter === "pending" 
                      ? "Nenhuma atividade pendente para esta matéria." 
                      : "Nenhuma atividade entregue para esta matéria."
                    }
                  </p>
                </div>
              )}
              {filteredTasks.map((task: any) => (
                <div key={task.id} className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition flex gap-4">
                  <div className="pt-1">
                    <button
                      onClick={() => handleToggleTask(task.id, task.isCompleted)}
                      disabled={togglingTaskId === task.id}
                      className={cn(
                        "transition-colors hover:scale-110 transform duration-150",
                        togglingTaskId === task.id && "opacity-50 animate-pulse"
                      )}
                      title={task.isCompleted ? "Marcar como pendente" : "Marcar como entregue"}
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 hover:text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(
                      "font-semibold text-lg",
                      task.isCompleted && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h4>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      {task.startDate && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Início:</span>
                          {format(new Date(task.startDate), "dd 'de' MMM", { locale: ptBR })}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-primary">
                        <CalendarIcon className="h-3 w-3" />
                        <span className="font-medium">Entrega:</span>
                        {format(new Date(task.dueDate), "dd 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>

                    {/* Exibição de Anexos */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                        {task.attachments.map((att: any) => (
                          <Link 
                            key={att.id} 
                            href={att.url} 
                            target="_blank"
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition"
                          >
                            {att.type === 'FILE' ? '📄 ' : '🔗 '}{att.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
