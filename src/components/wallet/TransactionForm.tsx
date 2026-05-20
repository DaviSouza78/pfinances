"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransaction } from "@/actions/wallet.actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CreditCard } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(2, "A descrição deve ter pelo menos 2 caracteres."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({
    message: "A data é obrigatória.",
  }),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  // Campos de parcelamento
  isInstallment: z.boolean().default(false),
  installments: z.coerce.number().min(2, "Mínimo de 2 parcelas.").max(48, "Máximo de 48 parcelas.").optional(),
  installmentValue: z.coerce.number().positive("Valor da parcela deve ser positivo.").optional(),
}).superRefine((data, ctx) => {
  if (data.isInstallment) {
    if (!data.installments || data.installments < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade de parcelas (mínimo 2).",
        path: ["installments"],
      });
    }
    if (!data.installmentValue || data.installmentValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o valor da parcela.",
        path: ["installmentValue"],
      });
    }
  }
});

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "EXPENSE",
      description: "",
      amount: 0,
      date: new Date(),
      notes: "",
      isInstallment: false,
      installments: 2,
      installmentValue: 0,
    },
  });

  const transactionType = form.watch("type");
  const isInstallment = form.watch("isInstallment");
  const totalAmount = form.watch("amount");
  const installmentCount = form.watch("installments");

  // Auto-calcular valor da parcela quando totalAmount ou installments mudam
  const handleAutoCalc = () => {
    const amt = form.getValues("amount");
    const count = form.getValues("installments");
    if (amt > 0 && count && count >= 2) {
      const perInstallment = Math.round((amt / count) * 100) / 100;
      form.setValue("installmentValue", perInstallment);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createTransaction({
        type: values.type,
        amount: values.amount,
        description: values.description,
        date: values.date,
        categoryId: values.categoryId,
        notes: values.notes,
        isInstallment: values.isInstallment,
        installments: values.installments,
        installmentValue: values.installmentValue,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-muted/50 p-6 rounded-lg border border-border mt-4 mb-8">
      <h3 className="text-lg font-semibold mb-4">Nova transação</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* TIPO */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>TIPO DE TRANSAÇÃO</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={field.value === "INCOME" ? "default" : "outline"}
                        className={cn(
                          "w-full",
                          field.value === "INCOME" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                        onClick={() => {
                          field.onChange("INCOME");
                          // Desativar parcelamento em Receitas
                          form.setValue("isInstallment", false);
                        }}
                      >
                        Receita
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "EXPENSE" ? "default" : "outline"}
                        className={cn(
                          "w-full",
                          field.value === "EXPENSE" && "bg-red-600 hover:bg-red-700 text-white"
                        )}
                        onClick={() => field.onChange("EXPENSE")}
                      >
                        Despesa
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIÇÃO */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DESCRIÇÃO</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salário, Conta de luz..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VALOR */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isInstallment ? "VALOR TOTAL" : "VALOR"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Recalcular parcela se ativo
                        if (isInstallment) {
                          setTimeout(handleAutoCalc, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CATEGORIA */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CATEGORIA</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="alimentacao">Alimentação</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="salario">Salário</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DATA */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>DATA DA TRANSAÇÃO</FormLabel>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full pl-3 text-left font-normal flex items-center justify-between border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* OBSERVAÇÕES */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OBSERVAÇÕES (OPCIONAL)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes adicionais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ─── Compra Parcelada (apenas para DESPESA) ─── */}
          {transactionType === "EXPENSE" && (
            <div className="border border-border rounded-lg p-4 space-y-4 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  <div>
                    <Label htmlFor="installment-switch" className="text-sm font-medium cursor-pointer">
                      Compra Parcelada?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Distribui o valor em múltiplas transações futuras
                    </p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="isInstallment"
                  render={({ field }) => (
                    <Switch
                      id="installment-switch"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          handleAutoCalc();
                        }
                      }}
                    />
                  )}
                />
              </div>

              {isInstallment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  {/* QUANTIDADE DE PARCELAS */}
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QUANTIDADE DE PARCELAS</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={2} 
                            max={48} 
                            placeholder="Ex: 12" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(handleAutoCalc, 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* VALOR DA PARCELA */}
                  <FormField
                    control={form.control}
                    name="installmentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VALOR DA PARCELA</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Auto-calculado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview das parcelas */}
                  {totalAmount > 0 && installmentCount && installmentCount >= 2 && (
                    <div className="md:col-span-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-blue-400 font-medium mb-1">
                        📋 Prévia do parcelamento
                      </p>
                      <p className="text-xs text-slate-400">
                        Serão criadas <span className="text-white font-semibold">{installmentCount} transações</span> com
                        sufixo <span className="text-white">&quot;{form.getValues("description") || "Descrição"} (1/{installmentCount})&quot;</span>, 
                        cada uma em meses consecutivos a partir de {form.getValues("date") ? format(form.getValues("date"), "dd/MM/yyyy") : "data selecionada"}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={transactionType === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {isSubmitting ? "Salvando..." : (
                isInstallment 
                  ? `Registrar ${installmentCount || 0}x Parcelas`
                  : `Registrar ${transactionType === "INCOME" ? "Receita" : "Despesa"}`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
