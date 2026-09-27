import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2, Phone, Loader2, LogOut } from "@/components/icons";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatarData, hojeISO, HORARIOS, linkWhatsApp, NOME_BARBEARIA } from "@/lib/barbearia";

type Agendamento = {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  preco: number;
  local: string;
  data: string;
  hora: string;
  status: string;
  notas: string | null;
};

const CORES: Record<string, string> = {
  pendente: "border-accent bg-accent/20",
  confirmado: "border-success bg-success/15",
  cancelado: "border-border bg-muted opacity-70",
};

export function Gestao() {
  useDocumentTitle(
    "Gestão de marcações — Mineral Barber",
    "Painel da barbearia: confirme, cancele e acompanhe as marcações do dia em tempo real.",
  );

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dia, setDia] = useState(hojeISO());

  const lista = useQuery({
    queryKey: ["agendamentos", dia],
    queryFn: async (): Promise<Agendamento[]> => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("data", dia)
        .order("hora");
      if (error) throw error;
      return (data ?? []) as Agendamento[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("agendamentos-gestao")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marcação actualizada");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apagar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marcação removida");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resumo = useMemo(() => {
    const rows = lista.data ?? [];
    const activos = rows.filter((r) => r.status !== "cancelado");
    return {
      pendentes: rows.filter((r) => r.status === "pendente").length,
      confirmados: rows.filter((r) => r.status === "confirmado").length,
      livres: HORARIOS.length - activos.length,
      receita: rows.filter((r) => r.status === "confirmado").reduce((a, r) => a + r.preco, 0),
    };
  }, [lista.data]);

  const mensagemCliente = (a: Agendamento, confirmado: boolean) =>
    linkWhatsApp(
      confirmado
        ? `Olá ${a.nome}! A sua marcação na ${NOME_BARBEARIA} está *CONFIRMADA* para ${formatarData(a.data)} às ${a.hora} — ${a.servico} (${a.preco} MT). Até já!`
        : `Olá ${a.nome}, sobre a sua marcação na ${NOME_BARBEARIA} para ${formatarData(a.data)} às ${a.hora}...`,
      a.telefone.replace(/\D/g, "").replace(/^0+/, "").replace(/^258?/, "258"),
    );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-3 pt-8">
        <div>
          <h1 className="text-4xl">Gestão de marcações</h1>
          <p className="text-sm text-muted-foreground">Actualiza em tempo real · 8h às 21h</p>
        </div>
        <Button
          variant="outline"
          className="border-2 border-ink"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/auth");
          }}
        >
          <LogOut className="size-4" /> Sair
        </Button>
      </header>

      <div className="ticket mt-6 flex flex-wrap items-center gap-4 p-4">
        <Input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="max-w-[11rem] border-2 border-ink bg-background font-display"
        />
        <Resumo titulo="Pendentes" valor={resumo.pendentes} />
        <Resumo titulo="Confirmados" valor={resumo.confirmados} />
        <Resumo titulo="Horas livres" valor={resumo.livres} />
        <Resumo titulo="Receita (MT)" valor={resumo.receita} />
      </div>

      <section className="mt-6 space-y-3">
        {lista.isLoading && <Loader2 className="mx-auto size-6 animate-spin" />}
        {lista.data?.length === 0 && (
          <p className="ticket p-6 text-center text-muted-foreground">
            Sem marcações para {formatarData(dia)}.
          </p>
        )}
        {lista.data?.map((a) => (
          <article key={a.id} className={`ticket border-2 p-4 ${CORES[a.status] ?? ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl">
                  {a.hora} · {a.nome}
                </p>
                <p className="text-sm">
                  {a.servico} · {a.preco} MT ·{" "}
                  {a.local === "domicilio" ? "Ao domicílio" : "Na barbearia"}
                </p>
                <p className="text-sm text-muted-foreground">{a.telefone}</p>
                {a.notas && <p className="mt-1 text-sm italic">"{a.notas}"</p>}
              </div>
              <span className="banner-ink px-2 py-1 font-display text-xs uppercase">
                {a.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="border-2 border-ink"
                disabled={a.status === "confirmado" || mudarStatus.isPending}
                onClick={() => mudarStatus.mutate({ id: a.id, status: "confirmado" })}
              >
                <Check className="size-4" /> Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-2 border-ink"
                disabled={a.status === "cancelado" || mudarStatus.isPending}
                onClick={() => mudarStatus.mutate({ id: a.id, status: "cancelado" })}
              >
                <X className="size-4" /> Cancelar
              </Button>
              <a
                href={mensagemCliente(a, a.status === "confirmado")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="secondary" className="border-2 border-ink">
                  <Phone className="size-4" /> WhatsApp
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => apagar.mutate(a.id)}
                disabled={apagar.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="min-w-20">
      <p className="text-xs tracking-widest text-muted-foreground uppercase">{titulo}</p>
      <p className="font-display text-2xl">{valor}</p>
    </div>
  );
}
