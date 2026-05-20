"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let title = "Erro na Autenticação";
  let description = "Ocorreu um erro desconhecido durante o processo de login.";

  if (error === "AccessDenied" || error === "Configuration") {
    title = "Acesso Não Autorizado";
    description = "Seu endereço de e-mail não está cadastrado na whitelist de acessos autorizados para esta aplicação.";
  }

  return (
    <Card className="w-full max-w-md bg-slate-900 border-none shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-500">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-slate-400 mt-2 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-xs text-slate-500 py-4 border-t border-b border-slate-800 my-4">
        Código do erro: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400 font-mono">{error || "Unknown"}</code>
      </CardContent>
      <CardFooter className="flex justify-center w-full">
        <Link href="/" className="w-full">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Voltar ao Início
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Suspense fallback={
        <div className="text-center text-sm text-slate-400">Carregando...</div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
