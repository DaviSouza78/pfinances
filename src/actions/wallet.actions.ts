"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { endOfMonth } from "date-fns";
import { addMonths } from "date-fns";
import { auth } from "@/auth";

export async function getWalletMetrics(month: number, year: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");
    const userId = session.user.id;

    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);

    // 1. Receitas e Despesas do Mês
    const monthlyTransactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const income = monthlyTransactions.find((t: any) => t.type === 'INCOME')?._sum.amount || 0;
    const expense = monthlyTransactions.find((t: any) => t.type === 'EXPENSE')?._sum.amount || 0;
    const balance = income - expense;

    // 2. Saldo Acumulado (Histórico ATÉ ao fim do mês selecionado)
    const historicalTransactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: {
          lte: endDate, // Tudo até ao final deste mês
        }
      },
      _sum: {
        amount: true,
      }
    });

    const totalIncome = historicalTransactions.find((t: any) => t.type === 'INCOME')?._sum.amount || 0;
    const totalExpense = historicalTransactions.find((t: any) => t.type === 'EXPENSE')?._sum.amount || 0;
    const accumulatedBalance = totalIncome - totalExpense;

    return {
      income,
      expense,
      balance,
      accumulatedBalance
    };
  } catch (error) {
    console.error("Database connection failed, returning fallback metrics:", error);
    return { income: 0, expense: 0, balance: 0, accumulatedBalance: 0 };
  }
}

export async function getMonthlyTransactions(month: number, year: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);

    return await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        category: true
      }
    });
  } catch (error) {
    console.error("Database connection failed, returning empty transactions:", error);
    return [];
  }
}

// Interface para o payload da transação (com suporte a parcelamento)
interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  notes?: string;
  isInstallment?: boolean;
  installments?: number;
  installmentValue?: number;
}

/**
 * Cria uma transação simples ou N transações parceladas.
 * 
 * Para compras parceladas:
 * - Distribui o valor em `installments` transações
 * - Cada transação recebe o sufixo "(1/N)", "(2/N)", etc.
 * - A data de cada parcela é incrementada em 1 mês usando date-fns `addMonths`
 *   que lida corretamente com edge-cases (31 jan → 28 fev, etc.)
 * - Usa `prisma.$transaction` + `createMany` para atomicidade
 */
export async function createTransaction(data: CreateTransactionPayload) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");

    const userId = session.user.id;

    // Removemos o categoryId temporariamente porque as categorias do Form são fictícias
    const { categoryId: _, isInstallment, installments, installmentValue, ...baseData } = data;

    if (isInstallment && installments && installments >= 2 && installmentValue && installmentValue > 0) {
      // ─── Modo Parcelado ───
      // Construir array de transações para inserção em massa
      const transactionsToCreate: {
        description: string;
        notes: string;
        amount: number;
        date: Date;
        type: 'INCOME' | 'EXPENSE';
        userId: string;
      }[] = [];

      for (let i = 0; i < installments; i++) {
        // Calcular a data exata para esta parcela
        // addMonths do date-fns lida corretamente com:
        // - 31/01 + 1 mês = 28/02 (ou 29 em bissexto)
        // - 30/03 + 1 mês = 30/04
        // - Viragens de ano (dez → jan)
        const installmentDate = addMonths(new Date(baseData.date), i);

        transactionsToCreate.push({
          description: `${baseData.description} (${i + 1}/${installments})`,
          notes: baseData.notes || `Parcela ${i + 1} de ${installments}`,
          amount: installmentValue,
          date: installmentDate,
          type: baseData.type,
          userId,
        });
      }

      // Inserção atômica de todas as parcelas
      await prisma.$transaction(async (tx) => {
        await tx.transaction.createMany({
          data: transactionsToCreate,
        });
      });
    } else {
      // ─── Modo Simples ───
      await prisma.transaction.create({
        data: {
          ...baseData,
          userId,
        },
      });
    }

    revalidatePath('/wallet');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to create transaction:", error);
    throw new Error("Falha ao salvar transação. Verifique sua conexão com o banco de dados.");
  }
}

