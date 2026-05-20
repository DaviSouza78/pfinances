import { auth } from "@/auth";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Permitir acesso livre para rotas internas do auth, login e assets estáticos
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth") 
    || nextUrl.pathname.startsWith("/auth/error")
    || nextUrl.pathname === "/login";

  if (!isLoggedIn && !isAuthRoute) {
    // Redireciona para a página customizada de login
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  // Executar proxy em todas as páginas exceto imagens, arquivos estáticos e chamadas de API (exceto auth)
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};
