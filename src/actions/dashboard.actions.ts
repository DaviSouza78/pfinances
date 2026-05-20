"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/auth";

export async function getDashboardMetrics() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // 1. Dados para os Cards Superiores (Mês Atual e Acumulado)
    const currentMonthTransactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: { amount: true },
    });

    const income = currentMonthTransactions.find((t: any) => t.type === 'INCOME')?._sum.amount || 0;
    const expense = currentMonthTransactions.find((t: any) => t.type === 'EXPENSE')?._sum.amount || 0;

    // Histórico para o saldo acumulado total
    const historical = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });
    const totalIncome = historical.find((t: any) => t.type === 'INCOME')?._sum.amount || 0;
    const totalExpense = historical.find((t: any) => t.type === 'EXPENSE')?._sum.amount || 0;
    const accumulatedBalance = totalIncome - totalExpense;

    // Taxa de Poupança (Mês atual)
    let savingsRate = 0;
    if (income > 0) {
      savingsRate = Math.max(0, ((income - expense) / income) * 100);
    }

    // 2. Dados para o Gráfico de Tendência (Últimos 6 meses)
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    
    const trendTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
        }
      },
      select: {
        amount: true,
        type: true,
        date: true
      }
    });

    // Agrupamento manual em memória para 6 meses
    const trendDataMap = new Map<string, { month: string; income: number; expense: number }>();
    
    // Inicializar os 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const monthLabel = format(d, "MMM", { locale: ptBR });
      trendDataMap.set(key, { month: monthLabel, income: 0, expense: 0 });
    }

    trendTransactions.forEach(t => {
      const key = format(t.date, "yyyy-MM");
      const entry = trendDataMap.get(key);
      if (entry) {
        if (t.type === "INCOME") entry.income += t.amount;
        if (t.type === "EXPENSE") entry.expense += t.amount;
      }
    });

    const trendData = Array.from(trendDataMap.values());

    return {
      overview: {
        income,
        expense,
        accumulatedBalance,
        savingsRate: Math.round(savingsRate)
      },
      trendData
    };
  } catch (error) {
    console.error("Database connection failed, returning fallback metrics:", error);
    
    // Fallback vazio caso o DB não esteja configurado
    const fallbackTrend = [];
    for (let i = 5; i >= 0; i--) {
      fallbackTrend.push({
        month: format(subMonths(new Date(), i), "MMM", { locale: ptBR }),
        income: 0,
        expense: 0
      });
    }

    return {
      overview: { income: 0, expense: 0, accumulatedBalance: 0, savingsRate: 0 },
      trendData: fallbackTrend
    };
  }
}
