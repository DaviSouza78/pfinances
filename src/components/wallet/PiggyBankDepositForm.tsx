"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addPiggyBankDeposit } from "@/actions/piggybank.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ message: "A data do aporte é obrigatória." }),
});

interface PiggyBankDepositFormProps {
  piggyBankId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PiggyBankDepositForm({ piggyBankId, onSuccess, onCancel }: PiggyBankDepositFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: 0,
      date: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await addPiggyBankDeposit(piggyBankId, values.amount, values.date);
      form.reset();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="bg-muted/50 p-4 rounded-md border border-border mt-3">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Registrar Novo Aporte</h5>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-foreground">Valor do Aporte (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" className="h-9 text-xs" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col pt-0.5">
                <FormLabel className="text-xs text-foreground">Data do Aporte (Retroativo)</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-full pl-3 text-left font-normal flex items-center justify-between border border-input rounded-md px-3 h-9 text-xs bg-background",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? format(field.value, "dd 'de' MMM 'yyyy'", { locale: ptBR }) : <span>Selecione...</span>}
                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50 text-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">Salvar Aporte</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
