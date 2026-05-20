"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: string;
  notes?: string | null;
  category?: { name: string } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="bg-slate-900 rounded-lg p-6 border border-none shadow-md mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Histórico de Transações</h3>
          <p className="text-sm text-muted-foreground">Movimentações do mês selecionado</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar transação..."
            className="w-full pl-9 bg-background/50 border-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <FileText className="h-8 w-8 mb-4 opacity-20" />
            <p>Nenhuma transação encontrada neste período.</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div 
              key={t.id} 
              className="flex items-center justify-between p-4 rounded-md bg-background/40 hover:bg-background/60 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {t.type === 'INCOME' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    {t.category && ` • ${t.category.name}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                </p>
                {t.notes && (
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {t.notes}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
