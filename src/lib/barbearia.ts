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

/** Nome de exibição da barbearia. */
export const NOME_BARBEARIA = "Mineral Barber";

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
  nota?: string;
};

export type LocalAtendimento = "barbearia" | "domicilio";

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
  { id: "corte-pigmentacao", nome: "Corte com pigmentação", preco: 130, categoria: "barbearia" },
  { id: "corte-normal", nome: "Corte normal", preco: 80, categoria: "barbearia" },
  { id: "alinhamento", nome: "Alinhamento do cabelo", preco: 25, categoria: "barbearia" },
  { id: "lavagem", nome: "Lavagem", preco: 40, categoria: "barbearia" },
  { id: "mascara-facial", nome: "Máscara facial", preco: 30, categoria: "barbearia" },
  {
    id: "dom-dentro-menor",
    nome: "Domicílio (dentro da cidade) — menores",
    preco: 150,
    categoria: "domicilio",
  },
  {
    id: "dom-dentro-adulto",
    nome: "Domicílio (dentro da cidade) — adultos",
    preco: 200,
    categoria: "domicilio",
  },
  {
    id: "dom-fora-aeroporto-menor",
    nome: "Fora da zona do aeroporto — menores",
    preco: 200,
    categoria: "domicilio",
  },
  {
    id: "dom-fora-aeroporto-adulto",
    nome: "Fora da zona do aeroporto — adultos",
    preco: 250,
    categoria: "domicilio",
  },
  { id: "dom-provincia", nome: "Dentro da província", preco: 1000, categoria: "domicilio" },
  { id: "dom-fora-provincia", nome: "Fora da província", preco: 2500, categoria: "domicilio" },
];

/** Devolve um serviço pelo id, ou `undefined` se não existir. */
export function buscarServicoPorId(id: string): Servico | undefined {
  return SERVICOS.find((servico) => servico.id === id);
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

/** Gera o link "wa.me" pronto a abrir, já com a mensagem codificada. */
export function linkWhatsApp(mensagem: string, numero: string = WHATSAPP_NUMERO): string {
  return `https://wa.me/${258879584486}?text=${encodeURIComponent(mensagem)}`;
}
