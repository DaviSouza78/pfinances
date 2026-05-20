"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";

// Busca a taxa CDI da BrasilAPI com cache de 1 hora
export async function getCDIRate(): Promise<number> {
  try {
    const res = await fetch("https://brasilapi.com.br/api/taxas/v1", {
      next: { revalidate: 3600 } // Cache de 1 hora
    });
    if (!res.ok) throw new Error("Failed to fetch CDI");
    const data = await res.json();
    const cdiItem = data.find((item: any) => item.nome.toUpperCase() === "CDI");
    return cdiItem ? cdiItem.valor : 10.65; // Fallback se não encontrar
  } catch (error) {
    console.error("Erro ao buscar CDI da BrasilAPI:", error);
    return 10.65; // CDI fallback histórico razoável
  }
}

// Helper para calcular dias úteis (Segunda a Sexta)
function getBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  curDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(endDate.getTime());
  targetDate.setHours(0, 0, 0, 0);

  while (curDate < targetDate) {
    const day = curDate.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// Retorna os dados de rendimento de um cofrinho
export async function getPiggyBankYield(piggyBankId: string) {
  const cdi = await getCDIRate();
  const yieldRate = new Decimal(cdi).mul(1.15).div(100); // CDI * 1.15 / 100
  const onePlusYield = new Decimal(1).add(yieldRate);
  const dailyRate = onePlusYield.pow(new Decimal(1).div(252)).sub(1); // 252 dias úteis

  const piggyBank = await prisma.piggyBank.findUnique({
    where: { id: piggyBankId },
    include: { deposits: true }
  });

  if (!piggyBank) {
    return {
      totalBalance: 0,
      totalDeposited: 0,
      totalInterest: 0,
      cdi
    };
  }

  let totalDeposited = new Decimal(0);
  let totalInterest = new Decimal(0);
  const now = new Date();

  // Sincronizar depósitos com suporte a saldo legado (criado antes da migração de depósitos)
  const deposits = [...piggyBank.deposits];
  const totalRegisteredDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
  
  if (piggyBank.savedAmount > totalRegisteredDeposits) {
    const legacyAmount = piggyBank.savedAmount - totalRegisteredDeposits;
    deposits.push({
      id: "legacy",
      amount: legacyAmount,
      date: piggyBank.createdAt,
      piggyBankId: piggyBank.id,
      createdAt: piggyBank.createdAt,
      updatedAt: piggyBank.createdAt
    } as any);
  }

  for (const deposit of deposits) {
    const depositAmount = new Decimal(deposit.amount);
    totalDeposited = totalDeposited.add(depositAmount);

    const businessDays = getBusinessDays(new Date(deposit.date), now);
    if (businessDays > 0) {
      const factor = dailyRate.add(1).pow(businessDays);
      const accumulated = depositAmount.mul(factor);
      const interest = accumulated.sub(depositAmount);
      totalInterest = totalInterest.add(interest);
    }
  }

  const totalBalance = totalDeposited.add(totalInterest);

  return {
    totalBalance: totalBalance.toNumber(),
    totalDeposited: totalDeposited.toNumber(),
    totalInterest: totalInterest.toNumber(),
    cdi
  };
}

// Cria um novo Cofrinho
export async function createPiggyBank(name: string, targetAmount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  const piggyBank = await prisma.piggyBank.create({
    data: {
      name,
      targetAmount,
      savedAmount: 0,
      userId: session.user.id
    }
  });

  revalidatePath("/wallet");
  return piggyBank;
}

// Adiciona um depósito a um cofrinho
export async function addPiggyBankDeposit(piggyBankId: string, amount: number, date: Date = new Date()) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  // Transação atômica: criar o depósito e atualizar o savedAmount (soma) do cofrinho para manter consistência legado/novo
  await prisma.$transaction(async (tx) => {
    await tx.piggyBankDeposit.create({
      data: {
        amount,
        date,
        piggyBankId
      }
    });

    await tx.piggyBank.update({
      where: { id: piggyBankId },
      data: {
        savedAmount: {
          increment: amount
        }
      }
    });
  });

  revalidatePath("/wallet");
}

// Busca todos os cofrinhos do usuário logado calculando rendimento composto em lote
export async function getPiggyBanks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const piggyBanks = await prisma.piggyBank.findMany({
    where: { userId: session.user.id },
    include: { deposits: true },
    orderBy: { createdAt: "desc" }
  });

  const list = [];
  for (const pb of piggyBanks) {
    const yieldData = await getPiggyBankYield(pb.id);
    list.push({
      ...pb,
      totalBalance: yieldData.totalBalance,
      totalDeposited: yieldData.totalDeposited,
      totalInterest: yieldData.totalInterest,
      cdi: yieldData.cdi
    });
  }

  return list;
}
