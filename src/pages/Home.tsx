import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Scissors, Clock, MapPin, Check, Loader2 } from "@/components/icons";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  SERVICOS,
  HORARIOS,
  NOME_BARBEARIA,
  formatarData,
  hojeISO,
  linkWhatsApp,
  mensagemWhatsApp,
} from "@/lib/barbearia";

type Ocupado = { hora: string; status: string };

export function Home() {
  useDocumentTitle(
    "Mineral Barber — Agendamento online da barbearia",
    "Agende o seu corte na Mineral Barber em tempo real. Horários das 8h às 21h, preços transparentes e confirmação imediata por WhatsApp.",
  );

  const queryClient = useQueryClient();
  const [data, setData] = useState(hojeISO());
  const [hora, setHora] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState(SERVICOS[0]!.id);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [notas, setNotas] = useState("");
  const [confirmado, setConfirmado] = useState<null | { hora: string; link: string }>(null);

  const servico = useMemo(() => SERVICOS.find((s) => s.id === servicoId)!, [servicoId]);

  const ocupadosQuery = useQuery({
    queryKey: ["ocupados", data],
    queryFn: async (): Promise<Ocupado[]> => {
      const { data: rows, error } = await supabase.rpc("horarios_ocupados", { p_data: data });
      if (error) throw error;
      return (rows ?? []) as Ocupado[];
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Tempo real: qualquer alteração nos agendamentos actualiza a grelha de horários.
  useEffect(() => {
    const channel = supabase
      .channel("agendamentos-publico")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ocupados"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const estadoDe = (h: string) => ocupadosQuery.data?.find((o) => o.hora === h)?.status ?? null;

  const agendar = useMutation({
    mutationFn: async () => {
      if (!hora) throw new Error("Escolha um horário.");
      if (nome.trim().length < 2) throw new Error("Escreva o seu nome.");
      if (telefone.trim().length !== 9) throw new Error("O número deve ter 9 dígitos.");
      const { error } = await supabase.from("agendamentos").insert({
        nome: nome.trim(),
        telefone: telefone.trim(),
        servico: servico.nome,
        preco: servico.preco,
        local: servico.categoria,
        data,
        hora,
        status: "pendente",
        notas: notas.trim() || null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Esse horário acabou de ser ocupado.");
        throw new Error(error.message);
      }
      return linkWhatsApp(
        mensagemWhatsApp({
          nome: nome.trim(),
          telefone: telefone.trim(),
          servico: servico.nome,
          preco: servico.preco,
          data,
          hora,
          local: servico.categoria,
          notas: notas.trim(),
        }),
      );
    },
    onSuccess: (link) => {
      setConfirmado({ hora: hora!, link });
      toast.success("Pedido enviado! Confirme pelo WhatsApp.");
      queryClient.invalidateQueries({ queryKey: ["ocupados"] });
      window.open(link, "_blank", "noopener,noreferrer");
      setHora(null);
      setNotas("");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      queryClient.invalidateQueries({ queryKey: ["ocupados"] });
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20">
      <header className="pt-8 text-center">
        <img
          src="/logo.png"
          alt={`${NOME_BARBEARIA} — logótipo`}
          className="mx-auto h-28 w-28 sm:h-36 sm:w-36"
        />
        <div className="banner-ink mx-auto mt-4 inline-flex items-center gap-2 px-4 py-1 text-xs tracking-[0.25em]">
          <Scissors className="size-3.5" /> QUALIDADE, ESTILO E CONFIANÇA
        </div>
        <h1 className="mt-4 text-5xl leading-none sm:text-7xl">{NOME_BARBEARIA}</h1>
        <p className="mt-2 font-display text-2xl text-primary sm:text-3xl">Agendamento online</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Veja os horários livres em tempo real, marque o seu corte e confirme na hora pelo
          WhatsApp. Aberto das 8h às 21h.
        </p>
      </header>

      {/* Agendamento */}
      <section className="ticket mt-8 p-4 sm:p-6">
        <h2 className="text-2xl">1. Escolha o serviço</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SERVICOS.map((s) => {
            const activo = s.id === servicoId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setServicoId(s.id)}
                className={`flex items-center justify-between gap-3 rounded border-2 px-3 py-2 text-left transition-colors ${
                  activo
                    ? "border-ink bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="font-display text-sm uppercase">{s.nome}</span>
                <span className="font-display text-lg whitespace-nowrap">{s.preco} MT</span>
              </button>
            );
          })}
        </div>

        <h2 className="mt-8 text-2xl">2. Escolha o dia</h2>
        <Input
          type="date"
          value={data}
          min={hojeISO()}
          onChange={(e) => {
            setData(e.target.value);
            setHora(null);
          }}
          className="mt-3 max-w-xs border-2 border-ink bg-background font-display"
        />

        <h2 className="mt-8 flex items-center gap-2 text-2xl">
          <Clock className="size-5" /> 3. Horário (8h — 21h)
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-7">
          {HORARIOS.map((h) => {
            const estado = estadoDe(h);
            const ocupado = estado !== null;
            const activo = hora === h;
            return (
              <button
                key={h}
                type="button"
                disabled={ocupado}
                onClick={() => setHora(h)}
                className={`rounded border-2 py-2 font-display text-base transition-colors ${
                  ocupado
                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                    : activo
                      ? "border-ink bg-primary text-primary-foreground"
                      : "border-ink bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {ocupadosQuery.isFetching ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <span className="inline-block size-2 rounded-full bg-success" />
          )}
          Disponibilidade actualizada em tempo real
        </p>

        <h2 className="mt-8 text-2xl">4. Os seus dados</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: João Miguel"
              className="mt-1 border-2 border-ink bg-background"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Contacto (WhatsApp)</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              placeholder="Ex.: 840000000"
              className="mt-1 border-2 border-ink bg-background"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notas">Observações / endereço (domicílio)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Bairro, referência ou pedido especial"
              className="mt-1 border-2 border-ink bg-background"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t-2 border-dashed border-ink pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg">
            {servico.nome} · {hora ? `${formatarData(data)} às ${hora}` : "escolha um horário"} ·{" "}
            <span className="text-primary">{servico.preco} MT</span>
          </p>
          <Button
            size="lg"
            className="border-2 border-ink font-display text-base uppercase"
            disabled={agendar.isPending || !hora}
            onClick={() => agendar.mutate()}
          >
            {agendar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Scissors className="size-4" />
            )}
            Agendar e enviar no WhatsApp
          </Button>
        </div>

        {confirmado && (
          <div className="mt-4 flex flex-col gap-2 rounded border-2 border-success bg-success/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-success" />
              Pedido das {confirmado.hora} registado. Está <b>pendente</b> até a barbearia
              confirmar.
            </p>
            <a
              href={confirmado.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm text-primary underline"
            >
              Reabrir WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* Tabela de preços */}
      <section className="ticket mt-8 p-4 sm:p-6">
        <h2 className="text-3xl">Tabela de preços</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="banner-ink px-3 py-1 text-sm">Na barbearia</h3>
            <ul className="mt-3 space-y-2">
              {SERVICOS.filter((s) => s.categoria === "barbearia").map((s) => (
                <li key={s.id} className="flex items-baseline gap-2">
                  <span className="font-display text-sm uppercase">{s.nome}</span>
                  <span className="flex-1 border-b-2 border-dotted border-border" />
                  <span className="font-display text-lg text-primary">{s.preco} MT</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="banner-ink flex items-center gap-2 px-3 py-1 text-sm">
              <MapPin className="size-3.5" /> Corte a domicílio
            </h3>
            <ul className="mt-3 space-y-2">
              {SERVICOS.filter((s) => s.categoria === "domicilio").map((s) => (
                <li key={s.id} className="flex items-baseline gap-2">
                  <span className="font-display text-sm uppercase">{s.nome}</span>
                  <span className="flex-1 border-b-2 border-dotted border-border" />
                  <span className="font-display text-lg text-primary">{s.preco} MT</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="mt-10 text-center">
        <p className="font-display text-xl">Seu visual, nossa excelência!</p>
        <p className="mt-1 text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Pontualidade · Respeito · Profissionalismo
        </p>
        <Link to="/auth" className="mt-4 inline-block text-xs text-muted-foreground underline">
          Área da barbearia
        </Link>
      </footer>
    </main>
  );
}
