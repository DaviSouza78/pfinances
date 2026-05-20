"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, Coins, TrendingUp } from "lucide-react";
import { getWalletMetrics, getMonthlyTransactions } from "@/actions/wallet.actions";
import { getSubscriptions } from "@/actions/subscription.actions";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { SubscriptionForm } from "./SubscriptionForm";
import { getPiggyBanks } from "@/actions/piggybank.actions";
import { PiggyBankForm } from "./PiggyBankForm";
import { PiggyBankDepositForm } from "./PiggyBankDepositForm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

export function WalletDashboardClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [isAddingPiggyBank, setIsAddingPiggyBank] = useState(false);
  const [selectedPiggyBankDepositId, setSelectedPiggyBankDepositId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    accumulatedBalance: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [piggyBanks, setPiggyBanks] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      const data = await getWalletMetrics(currentDate.getMonth(), currentDate.getFullYear());
      setMetrics(data);

      const txs = await getMonthlyTransactions(currentDate.getMonth(), currentDate.getFullYear());
      setTransactions(txs);

      const subs = await getSubscriptions();
      setSubscriptions(subs);

      const pbs = await getPiggyBanks();
      setPiggyBanks(pbs);
    } catch (error) {
      console.error("Failed to fetch metrics", error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthName = format(currentDate, "MMMM 'De' yyyy", { locale: ptBR });

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA CARTEIRA */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground text-sm">
            Controle financeiro com precisão de centavos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted rounded-md p-1 border border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-32 text-center text-sm font-medium capitalize">
              {monthName}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Importar extrato
          </Button>

          <Button 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            + Nova transação
            {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* FORMULÁRIO INLINE */}
      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <CollapsibleContent className="CollapsibleContent">
          <TransactionForm 
            onSuccess={() => {
              setIsFormOpen(false);
              fetchMetrics();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* RECEITAS */}
        <Card className="bg-slate-900 border-none shadow-md relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Receitas
            </CardTitle>
            <div className="text-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500 mb-1">
              {formatCurrency(metrics.income)}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* DESPESAS */}
        <Card className="bg-slate-900 border-none shadow-md relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Despesas
            </CardTitle>
            <div className="text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500 mb-1">
              {formatCurrency(metrics.expense)}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* SALDO ACUMULADO */}
        <Card className="bg-[#0f1f14] border-none shadow-md relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider">
              Saldo Acumulado
            </CardTitle>
            <div className="text-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><path d="M3 15h18"></path><path d="M3 9h18"></path></svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500 mb-1">
              {formatCurrency(metrics.accumulatedBalance)}
            </div>
            <p className="text-xs text-emerald-500/60 capitalize">
              Até {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <TransactionList transactions={transactions} />

      {/* SEÇÃO DE ASSINATURAS */}
      <Card className="bg-slate-900 border-none mt-8 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Assinaturas Recorrentes</CardTitle>
            <p className="text-sm text-muted-foreground">Gerencie seus serviços de pagamento automático</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none"
            onClick={() => setIsAddingSubscription(!isAddingSubscription)}
          >
            {isAddingSubscription ? "Fechar" : "+ Nova Assinatura"}
          </Button>
        </CardHeader>
        <CardContent>
          {isAddingSubscription && (
            <SubscriptionForm 
              onSuccess={() => {
                setIsAddingSubscription(false);
                fetchMetrics();
              }} 
              onCancel={() => setIsAddingSubscription(false)} 
            />
          )}

          <div className="space-y-4 mt-4">
            {subscriptions.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg py-8">
                Você ainda não tem nenhuma assinatura ativa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 border border-border rounded-lg bg-background flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {sub.name}
                        {sub.website && (
                          <a href={sub.website} target="_blank" className="text-xs text-blue-500 hover:underline">
                            Site
                          </a>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Próxima cobrança: {format(new Date(sub.nextBillingDate), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                        {sub.frequency === "MONTHLY" ? "Mensal" : "Anual"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-500">
                        {formatCurrency(sub.amount)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Ativa
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO DE COFRINHOS */}
      <Card className="bg-slate-900 border-none mt-8 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Cofrinhos (Rendimento 115% do CDI)</CardTitle>
            <p className="text-sm text-muted-foreground">Guarde dinheiro e acompanhe seu rendimento simulado</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none"
            onClick={() => setIsAddingPiggyBank(!isAddingPiggyBank)}
          >
            {isAddingPiggyBank ? "Fechar" : "+ Novo Cofrinho"}
          </Button>
        </CardHeader>
        <CardContent>
          {isAddingPiggyBank && (
            <PiggyBankForm 
              onSuccess={() => {
                setIsAddingPiggyBank(false);
                fetchMetrics();
              }}
              onCancel={() => setIsAddingPiggyBank(false)}
            />
          )}

          <div className="space-y-6 mt-4">
            {piggyBanks.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg py-8">
                Você ainda não tem nenhum cofrinho criado. Crie um para começar!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {piggyBanks.map((pb) => {
                  const percentage = Math.min((pb.totalBalance / pb.targetAmount) * 100, 100);
                  
                  return (
                    <div key={pb.id} className="p-5 border border-border rounded-xl bg-background flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-500">
                              <Coins className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground text-base">{pb.name}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                <span>115% do CDI (atual: {pb.cdi.toFixed(2)}%)</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {percentage.toFixed(0)}% da meta
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full bg-slate-800 rounded-full h-2 my-4 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/40 py-2.5 rounded-lg border border-slate-900 px-1 my-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Original</p>
                            <p className="text-xs font-semibold text-foreground mt-0.5">{formatCurrency(pb.totalDeposited)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-500 uppercase font-medium">Rendimento</p>
                            <p className="text-xs font-semibold text-emerald-500 mt-0.5">+{formatCurrency(pb.totalInterest)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-blue-400 uppercase font-medium">Saldo Total</p>
                            <p className="text-xs font-bold text-blue-400 mt-0.5">{formatCurrency(pb.totalBalance)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                          <span>Meta: {formatCurrency(pb.targetAmount)}</span>
                          <span>Falta: {formatCurrency(Math.max(pb.targetAmount - pb.totalBalance, 0))}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-blue-500 hover:text-blue-400 hover:bg-slate-950/50 py-1 h-8 mt-1 border border-dashed border-blue-500/20"
                          onClick={() => {
                            setSelectedPiggyBankDepositId(
                              selectedPiggyBankDepositId === pb.id ? null : pb.id
                            );
                          }}
                        >
                          {selectedPiggyBankDepositId === pb.id ? "Cancelar" : "Fazer Aporte / Depósito"}
                        </Button>

                        {selectedPiggyBankDepositId === pb.id && (
                          <PiggyBankDepositForm
                            piggyBankId={pb.id}
                            onSuccess={() => {
                              setSelectedPiggyBankDepositId(null);
                              fetchMetrics();
                            }}
                            onCancel={() => setSelectedPiggyBankDepositId(null)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
