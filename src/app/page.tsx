import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Percent, Target, Calendar, CreditCard, RepeatIcon } from "lucide-react";
import { getDashboardMetrics } from "@/actions/dashboard.actions";
import { getUpcomingTasks } from "@/actions/studies.actions";
import { getSubscriptionSummary } from "@/actions/subscription.actions";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

// Helper de formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default async function Dashboard() {
  const data = await getDashboardMetrics();
  const upcomingTasks = await getUpcomingTasks();
  const subscriptionSummary = await getSubscriptionSummary();
  const { overview, trendData } = data;

  return (
    <div className="space-y-8 flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">
            Acompanhe suas finanças, hábitos e estudos em um só lugar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Saldo Acumulado
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(overview.accumulatedBalance)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Receitas (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(overview.income)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Despesas (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(overview.expense)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Taxa de Poupança
            </CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{overview.savingsRate}%</div>
            <p className="text-xs text-muted-foreground">
              Mês Atual
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-slate-900 border-none shadow-md">
          <CardHeader>
            <CardTitle>Tendência Financeira (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[350px]">
            <TrendChart data={trendData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-slate-900 border-none shadow-md">
          <CardHeader>
            <CardTitle>Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma entrega agendada.</p>
              ) : (
                upcomingTasks.map((task) => {
                  const dueDate = new Date(task.dueDate);
                  const now = new Date();
                  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  let urgencyColor = "text-muted-foreground";
                  let urgencyBg = "";
                  let urgencyLabel = "";
                  
                  if (diffDays < 0) {
                    urgencyColor = "text-red-400";
                    urgencyBg = "bg-red-500/10 border-red-500/20";
                    urgencyLabel = "Atrasada";
                  } else if (diffDays === 0) {
                    urgencyColor = "text-orange-400";
                    urgencyBg = "bg-orange-500/10 border-orange-500/20";
                    urgencyLabel = "Hoje";
                  } else if (diffDays <= 3) {
                    urgencyColor = "text-yellow-400";
                    urgencyBg = "bg-yellow-500/5 border-yellow-500/10";
                  }

                  return (
                    <div key={task.id} className={`flex items-center p-2 rounded-lg border transition-colors ${urgencyBg || "border-transparent"}`}>
                      <Target className={`mr-2 h-4 w-4 ${urgencyColor === "text-muted-foreground" ? "text-primary" : urgencyColor}`} />
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{task.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className={`w-3 h-3 ${urgencyColor}`} />
                          <span className={urgencyColor}>{format(dueDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                          {urgencyLabel && (
                            <>
                              <span>•</span>
                              <span className={`${urgencyColor} font-semibold text-[10px] uppercase`}>{urgencyLabel}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-primary font-medium">{task.subject.name}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Assinaturas Recorrentes ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-3 bg-slate-900 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Custo Fixo Mensal</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Assinaturas ativas</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <RepeatIcon className="h-5 w-5 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-400 mb-4">
              {formatCurrency(subscriptionSummary.monthlyTotal)}
              <span className="text-sm font-normal text-muted-foreground ml-1">/mês</span>
            </div>

            {subscriptionSummary.upcoming.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Próximas cobranças neste mês</p>
                {subscriptionSummary.upcoming.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/40"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-violet-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{sub.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Vence {format(new Date(sub.nextBillingDate), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-400">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma cobrança pendente neste mês.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
