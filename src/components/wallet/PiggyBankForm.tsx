"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPiggyBank } from "@/actions/piggybank.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "O nome do cofrinho é obrigatório."),
  targetAmount: z.coerce.number().positive("A meta deve ser um valor positivo."),
});

interface PiggyBankFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PiggyBankForm({ onSuccess, onCancel }: PiggyBankFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      targetAmount: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await createPiggyBank(values.name, values.targetAmount);
      form.reset();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="bg-muted/30 p-6 rounded-lg border my-4">
      <h4 className="font-semibold text-md mb-4 text-foreground">Novo Cofrinho</h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cofrinho</FormLabel>
                <FormControl><Input placeholder="Ex: Viagem, Carro Novo, Reserva de Emergência..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="targetAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Meta de Valor (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Criar Cofrinho</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
