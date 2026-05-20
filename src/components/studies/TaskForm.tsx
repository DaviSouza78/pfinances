import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTask } from "@/actions/studies.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";

const schema = z.object({
  title: z.string().min(2, "O título é obrigatório."),
  description: z.string().optional(),
  startDate: z.date().optional(),
  dueDate: z.date({ message: "Data de entrega obrigatória." }),
  link: z.string().url("Insira uma URL válida").optional().or(z.literal("")),
}).refine(data => {
  if (data.startDate && data.dueDate) {
    return data.dueDate >= data.startDate;
  }
  return true;
}, {
  message: "A data de entrega não pode ser anterior à data de início.",
  path: ["dueDate"],
});

export function TaskForm({ subjectId, onSuccess, onCancel }: { subjectId: string; onSuccess: () => void; onCancel: () => void }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const attachments: any[] = [];
    if (values.link) attachments.push({ name: "Link Externo", url: values.link, type: "LINK" });
    if (fileUrl && fileName) attachments.push({ name: fileName, url: fileUrl, type: "FILE" });

    await createTask({
      title: values.title,
      description: values.description,
      startDate: values.startDate,
      dueDate: values.dueDate,
      subjectId,
      attachments,
    });
    
    form.reset();
    onSuccess();
  }

  return (
    <div className="bg-muted/30 p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título da Atividade</FormLabel>
                <FormControl><Input placeholder="Ex: Lista de Exercícios 1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl><Input placeholder="Detalhes da entrega..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="startDate" render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-full pl-3 text-left font-normal flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background border-input",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Data de Entrega</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-full pl-3 text-left font-normal flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background border-input",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="link" render={({ field }) => (
              <FormItem className="md:col-span-2 mt-2">
                <FormLabel>Link Externo (Ex: Google Docs)</FormLabel>
                <FormControl>
                  <div className="flex relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="https://..." {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="mt-4 border-t pt-4">
            <FormLabel className="mb-2 block">Anexar Ficheiro (Opcional)</FormLabel>
            {fileUrl ? (
              <div className="p-3 bg-primary/10 text-primary rounded-md text-sm font-medium">
                Arquivo anexado: {fileName}
              </div>
            ) : (
              <UploadDropzone
                endpoint="taskAttachment"
                onClientUploadComplete={(res) => {
                  setFileUrl(res[0].url);
                  setFileName(res[0].name);
                  alert("Upload concluído!");
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar Atividade</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
