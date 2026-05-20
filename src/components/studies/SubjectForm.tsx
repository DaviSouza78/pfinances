import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubject } from "@/actions/studies.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

export function SubjectForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    await createSubject(values);
    form.reset();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-3 rounded-md bg-background">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Matéria</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Cálculo I" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="sm">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
