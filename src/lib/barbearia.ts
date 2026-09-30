/**
 * Configuração e utilitários da Mineral Barber.
 *
 * Este módulo centraliza os dados estáticos do negócio (serviços, horários,
 * contacto) e as funções puras usadas para formatar datas e montar a
 * mensagem de agendamento enviada via WhatsApp.
 */

// ---------------------------------------------------------------------------
// Configuração geral
// ---------------------------------------------------------------------------

/** Número de WhatsApp da barbearia, em formato internacional (sem "+"). */
export const WHATSAPP_NUMERO = "258879584486";

/** Telefone da barbearia para chamadas e SMS, em formato internacional (sem "+"). */
export const TELEFONE_BARBEARIA = "258879584486";

/** Telefone da barbearia formatado para mostrar ao cliente. */
export const TELEFONE_BARBEARIA_EXIBIDO = "87 958 4486";

/** Nome de exibição da barbearia. */
export const NOME_BARBEARIA = "Barbearia Mineral";

/** Hora de abertura e fecho (formato 24h) usadas para gerar a tabela de horários. */
const HORA_ABERTURA = 8;
const HORA_FECHO = 21;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type CategoriaServico = "barbearia" | "domicilio";

export type Servico = {
  /** Identificador único, estável, usado como chave em listas e seleções. */
  id: string;
  nome: string;
  /** Preço em Meticais (MT). */
  preco: number;
  categoria: CategoriaServico;
  /** Se definido, o serviço só aparece para esse público (adultos ou menores). */
  publico?: PublicoServico;
  nota?: string;
};

export type LocalAtendimento = "barbearia" | "domicilio";

/** Público-alvo de um serviço na barbearia. Sem valor = serve para ambos. */
export type PublicoServico = "adulto" | "menor";

export type DadosAgendamento = {
  nome: string;
  telefone: string;
  servico: string;
  preco: number;
  /** Data no formato ISO (AAAA-MM-DD). */
  data: string;
  /** Hora no formato HH:mm. */
  hora: string;
  local: LocalAtendimento;
  notas?: string;
};

// ---------------------------------------------------------------------------
// Catálogo de serviços
// ---------------------------------------------------------------------------

export const SERVICOS: Servico[] = [
  { id: "corte-pigmentacao", nome: "Corte com pigmentação - Barbearia", preco: 130, categoria: "barbearia", publico: "adulto" },
  { id: "corte-normal", nome: "Corte normal - Barbearia", preco: 80, categoria: "barbearia", publico: "adulto" },
  { id: "corte-pigmentacao-menor", nome: "Corte com pigmentação - Barbearia (menores)", preco: 100, categoria: "barbearia", publico: "menor" },
  { id: "corte-normal-menor", nome: "Corte normal - Barbearia (menores)", preco: 50, categoria: "barbearia", publico: "menor" },
  { id: "alinhamento", nome: "Alinhamento do cabelo - Barbearia", preco: 25, categoria: "barbearia" },
  { id: "lavagem", nome: "Lavagem - barbearia", preco: 40, categoria: "barbearia" },
  { id: "mascara-facial", nome: "Máscara facial - barbearia", preco: 30, categoria: "barbearia" },
  // Domicílio — dentro da cidade
  { id: "dom-dentro-pigmentacao", nome: "Corte com pigmentação — Dentro da cidade (adultos)", preco: 200, categoria: "domicilio", publico: "adulto" },
  { id: "dom-dentro-normal", nome: "Corte normal — Dentro da cidade (adultos)", preco: 150, categoria: "domicilio", publico: "adulto" },
  { id: "dom-dentro-pigmentacao-menor", nome: "Corte com pigmentação — Dentro da cidade (menores)", preco: 150, categoria: "domicilio", publico: "menor" },
  { id: "dom-dentro-normal-menor", nome: "Corte normal — Dentro da cidade (menores)", preco: 100, categoria: "domicilio", publico: "menor" },
  // Domicílio — fora da zona do aeroporto
  { id: "dom-fora-aeroporto-pigmentacao", nome: "Corte com pigmentação — Fora da zona do aeroporto (adultos)", preco: 250, categoria: "domicilio", publico: "adulto" },
  { id: "dom-fora-aeroporto-normal", nome: "Corte normal — Fora da zona do aeroporto (adultos)", preco: 200, categoria: "domicilio", publico: "adulto" },
  { id: "dom-fora-aeroporto-pigmentacao-menor", nome: "Corte com pigmentação — Fora da zona do aeroporto (menores)", preco: 200, categoria: "domicilio", publico: "menor" },
  { id: "dom-fora-aeroporto-normal-menor", nome: "Corte normal — Fora da zona do aeroporto (menores)", preco: 150, categoria: "domicilio", publico: "menor" },
  // Domicílio — deslocações longas (valem para adultos e menores)
  { id: "dom-provincia", nome: "Dentro da província", preco: 1000, categoria: "domicilio" },
  { id: "dom-fora-provincia", nome: "Fora da província", preco: 2500, categoria: "domicilio" },
];

/**
 * Serviços que o cliente pode adicionar como extras ao agendamento.
 * Só estes dois, com o nome curto (sem o sufixo "- barbearia").
 */
const NOMES_EXTRA: Record<string, string> = {
  lavagem: "Lavagem",
  "mascara-facial": "Máscara facial",
};

export const SERVICOS_EXTRA: Servico[] = SERVICOS.filter((s) => s.id in NOMES_EXTRA).map((s) => ({
  ...s,
  nome: NOMES_EXTRA[s.id]!,
}));

/** Devolve um serviço pelo id, ou `undefined` se não existir. */
export function buscarServicoPorId(id: string): Servico | undefined {
  return SERVICOS.find((servico) => servico.id === id);
}

/**
 * Serviços de uma categoria visíveis para um público.
 * Os que não têm `publico` (ex.: alinhamento, lavagem, província) aparecem para ambos.
 */
export function servicosPorPublico(categoria: CategoriaServico, publico: PublicoServico): Servico[] {
  return SERVICOS.filter(
    (s) => s.categoria === categoria && (!s.publico || s.publico === publico),
  );
}

/**
 * Converte o id de um corte para o equivalente do outro público
 * (ex.: "corte-normal" ⇄ "corte-normal-menor"). Se não houver equivalente,
 * devolve o próprio id.
 */
export function idParaPublico(id: string, publico: PublicoServico): string {
  const base = id.replace(/-menor$/, "");
  const candidato = publico === "menor" ? `${base}-menor` : base;
  return buscarServicoPorId(candidato) ? candidato : id;
}

/** Devolve apenas os serviços de uma categoria (ex.: só os de domicílio). */
export function servicosPorCategoria(categoria: CategoriaServico): Servico[] {
  return SERVICOS.filter((servico) => servico.categoria === categoria);
}

// ---------------------------------------------------------------------------
// Horários
// ---------------------------------------------------------------------------

/** Tabela de horários disponíveis, de hora em hora, entre abertura e fecho. */
export const HORARIOS: string[] = Array.from(
  { length: HORA_FECHO - HORA_ABERTURA + 1 },
  (_, i) => `${String(HORA_ABERTURA + i).padStart(2, "0")}:00`,
);

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/** Converte uma data ISO (AAAA-MM-DD) para o formato DD/MM/AAAA. */
export function formatarData(dataISO: string): string {
  const partes = dataISO.split("-");
  if (partes.length !== 3) {
    throw new Error(`Data inválida: "${dataISO}". Esperado o formato AAAA-MM-DD.`);
  }
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/** Devolve a data de hoje, no fuso horário local, em formato ISO (AAAA-MM-DD). */
export function hojeISO(): string {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

/** Monta a mensagem de confirmação de agendamento enviada para o WhatsApp. */
export function mensagemWhatsApp(dados: DadosAgendamento): string {
  const linhas = [
    `*NOVO AGENDAMENTO — ${NOME_BARBEARIA}*`,
    `------------------------------`,
    `• Cliente: ${dados.nome}`,
    `• Contacto: ${dados.telefone}`,
    `• Serviço: ${dados.servico}`,
    `• Preço: ${dados.preco} MT`,
    `• Data: ${formatarData(dados.data)}`,
    `• Hora: ${dados.hora}`,
    `• Local: ${dados.local === "domicilio" ? "Ao domicílio" : "Na barbearia"}`,
  ];

  if (dados.notas) {
    linhas.push(`• Observações: ${dados.notas}`);
  }

  linhas.push(`------------------------------`, `Confirme por favor a marcação. Obrigado!`);
  return linhas.join("\n");
}

/** Link "tel:" que abre o marcador de chamadas (funciona sem dados móveis). */
export function linkChamada(numero: string = TELEFONE_BARBEARIA): string {
  return `tel:+${numero}`;
}

/** Link "sms:" que abre as mensagens, opcionalmente com o texto já escrito. */
export function linkSMS(texto?: string, numero: string = TELEFONE_BARBEARIA): string {
  return texto ? `sms:+${numero}?body=${encodeURIComponent(texto)}` : `sms:+${numero}`;
}

/** Gera o link "wa.me" pronto a abrir, já com a mensagem codificada. */
export function linkWhatsApp(mensagem: string, numero: string = WHATSAPP_NUMERO): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
