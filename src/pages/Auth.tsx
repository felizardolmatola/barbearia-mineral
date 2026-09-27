import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Scissors, ShieldAlert } from "@/components/icons";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function Auth() {
  useDocumentTitle(
    "Área da barbearia — Mineral Barber",
    "Entrada reservada à equipa da Mineral Barber para gerir e confirmar marcações.",
  );

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const erro = searchParams.get("erro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (erro === "sem-acesso") return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/gestao");
    });
  }, [navigate, erro]);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/gestao");
    } catch {
      // Mensagem genérica: não revela se o email existe.
      toast.error("Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="ticket p-6">
        <div className="banner-ink inline-flex items-center gap-2 px-3 py-1 text-xs tracking-[0.2em]">
          <Scissors className="size-3.5" /> ÁREA DA BARBEARIA
        </div>
        <h1 className="mt-4 text-3xl">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso restrito à equipa autorizada da barbearia.
        </p>

        {erro === "sem-acesso" && (
          <div className="mt-4 flex items-start gap-2 border-2 border-ink bg-muted p-3 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Esta conta não tem permissão para o painel de gestão. Peça ao administrador para lhe
              dar acesso.
            </span>
          </div>
        )}

        <form onSubmit={submeter} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 border-2 border-ink bg-background"
            />
          </div>
          <div>
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border-2 border-ink bg-background"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-ink font-display uppercase"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t-2 border-dashed border-ink pt-3">
          <Link to="/" className="text-xs text-muted-foreground underline">
            ← Voltar ao agendamento
          </Link>
        </div>
      </div>
    </main>
  );
}
