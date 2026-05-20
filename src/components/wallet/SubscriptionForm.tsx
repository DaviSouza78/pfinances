"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubscription } from "@/actions/subscription.actions";
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
  name: z.string().min(2, "O nome da assinatura é obrigatório."),
  website: z.string().url("Insira um site válido").optional().or(z.literal("")),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  frequency: z.enum(["MONTHLY", "YEARLY"]),
  nextBillingDate: z.date({ message: "A primeira data de cobrança é obrigatória." }),
});

export function SubscriptionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      website: "",
      amount: 0,
      frequency: "MONTHLY",
      nextBillingDate: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    await createSubscription({
      name: values.name,
      website: values.website || undefined,
      amount: values.amount,
      frequency: values.frequency,
      nextBillingDate: values.nextBillingDate,
    });
    form.reset();
    onSuccess();
  }

  return (
    <div className="bg-muted/30 p-6 rounded-lg border my-4">
      <h4 className="font-semibold text-md mb-4 text-foreground">Nova Assinatura</h4>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Ex: Netflix, Spotify..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>Site (Opcional)</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="frequency" render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button" 
                      variant={field.value === "MONTHLY" ? "default" : "outline"}
                      onClick={() => field.onChange("MONTHLY")}
                      className={cn(field.value === "MONTHLY" && "bg-blue-600 hover:bg-blue-700 text-white")}
                    >
                      Mensal
                    </Button>
                    <Button 
                      type="button" 
                      variant={field.value === "YEARLY" ? "default" : "outline"}
                      onClick={() => field.onChange("YEARLY")}
                      className={cn(field.value === "YEARLY" && "bg-blue-600 hover:bg-blue-700 text-white")}
                    >
                      Anual
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nextBillingDate" render={({ field }) => (
              <FormItem className="flex flex-col pt-1">
                <FormLabel>Próxima Cobrança</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-full pl-3 text-left font-normal flex items-center justify-between border border-input rounded-md px-3 py-2 text-sm bg-background",
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" size="sm">Registrar Assinatura</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
