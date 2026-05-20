"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createSubscription(data: {
  name: string;
  website?: string;
  amount: number;
  frequency: "MONTHLY" | "YEARLY";
  nextBillingDate: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado");

    await prisma.subscription.create({
      data: {
        ...data,
        userId: session.user.id
      }
    });

    revalidatePath('/wallet');
  } catch (error) {
    console.error("Failed to create subscription:", error);
    throw new Error("Falha ao criar assinatura.");
  }
}

export async function getSubscriptions() {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { nextBillingDate: 'asc' }
    });
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return [];
  }
}

export async function processSubscriptions() {
  try {
    const today = new Date();
    
    // Buscar assinaturas vencidas hoje ou antes de hoje
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        active: true,
        nextBillingDate: {
          lte: today
        }
      }
    });

    let processedCount = 0;

    for (const sub of dueSubscriptions) {
      // Calcular próxima data com base na frequência
      const nextDate = new Date(sub.nextBillingDate);
      if (sub.frequency === "MONTHLY") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      // Execução Atômica
      await prisma.$transaction(async (tx) => {
        // 1. Criar Despesa
        await tx.transaction.create({
          data: {
            description: `Assinatura: ${sub.name}`,
            amount: sub.amount,
            date: sub.nextBillingDate, // O dia em que efetivamente venceu
            type: 'EXPENSE',
            userId: sub.userId,
            notes: 'Gerado automaticamente pelo sistema de assinaturas.'
          }
        });

        // 2. Empurrar data da próxima cobrança
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: nextDate
          }
        });
      });
      processedCount++;
    }

    return { success: true, processed: processedCount };
  } catch (error) {
    console.error("Subscription Cron failed:", error);
    throw new Error("Falha ao processar rotina de assinaturas.");
  }
}

/**
 * Resumo das assinaturas para o Dashboard.
 * Retorna o custo fixo mensal total e as próximas cobranças do mês.
 */
export async function getSubscriptionSummary() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { monthlyTotal: 0, upcoming: [] };
    }

    const subs = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        active: true,
      },
      orderBy: { nextBillingDate: "asc" },
    });

    // Custo fixo mensal: mensal = valor; anual = valor / 12
    let monthlyTotal = 0;
    for (const sub of subs) {
      monthlyTotal += sub.frequency === "YEARLY" ? sub.amount / 12 : sub.amount;
    }

    // Próximas cobranças no mês corrente (até 3)
    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const upcoming = subs
      .filter((s) => new Date(s.nextBillingDate) <= endOfCurrentMonth)
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        nextBillingDate: s.nextBillingDate,
      }));

    return { monthlyTotal: Math.round(monthlyTotal * 100) / 100, upcoming };
  } catch (error) {
    console.error("Failed to get subscription summary:", error);
    return { monthlyTotal: 0, upcoming: [] };
  }
}
