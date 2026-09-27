import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "@/components/icons";

import { supabase } from "@/integrations/supabase/client";

type Estado =
  | { status: "a-verificar" }
  | { status: "autorizado" }
  | { status: "sem-sessao" }
  | { status: "sem-acesso" };

/**
 * Protege as rotas de gestão: exige sessão Supabase válida e um papel
 * (admin ou staff) em user_roles. Equivalente ao antigo beforeLoad de
 * `/_authenticated`, agora executado no cliente.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ status: "a-verificar" });

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (!cancelado) setEstado({ status: "sem-sessao" });
        return;
      }

      const { data: papeis } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const autorizado = (papeis ?? []).some((p) => p.role === "admin" || p.role === "staff");
      if (cancelado) return;

      if (!autorizado) {
        await supabase.auth.signOut();
        setEstado({ status: "sem-acesso" });
        return;
      }

      setEstado({ status: "autorizado" });
    }

    verificar();
    return () => {
      cancelado = true;
    };
  }, []);

  if (estado.status === "a-verificar") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (estado.status === "sem-sessao") {
    return <Navigate to="/auth" replace />;
  }

  if (estado.status === "sem-acesso") {
    return <Navigate to="/auth?erro=sem-acesso" replace />;
  }

  return <>{children}</>;
}
