import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Neon Grid Accent from Stitch */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-xs font-mono text-muted-foreground animate-pulse">
            Memuat konsol autentikasi...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
