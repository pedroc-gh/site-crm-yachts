// Textos exibidos para cada valor guardado no banco.
import type { Etapa, TipoInteracao, Condicao, StatusEmbarcacao, StatusProposta } from "@prisma/client";

export const ETAPAS: { valor: Etapa; rotulo: string; descricao: string }[] = [
  { valor: "NOVO_LEAD", rotulo: "Novo lead", descricao: "Entrou na carteira, ainda sem contato" },
  { valor: "PRIMEIRO_CONTATO", rotulo: "Primeiro contato", descricao: "Conversa iniciada" },
  { valor: "QUALIFICADO", rotulo: "Qualificado", descricao: "Perfil, orçamento e modelo entendidos" },
  { valor: "VISITA_SEA_TRIAL", rotulo: "Visita / sea trial", descricao: "Conheceu o barco ou navegou" },
  { valor: "PROPOSTA", rotulo: "Proposta", descricao: "Proposta enviada" },
  { valor: "NEGOCIACAO", rotulo: "Negociação", descricao: "Ajustando valores e condições" },
  { valor: "GANHO", rotulo: "Venda fechada", descricao: "Contrato assinado" },
  { valor: "PERDIDO", rotulo: "Perdido", descricao: "Não seguiu com a compra" },
];

export const rotuloEtapa = (e: Etapa) => ETAPAS.find((x) => x.valor === e)?.rotulo ?? e;

export const TIPOS_INTERACAO: { valor: TipoInteracao; rotulo: string }[] = [
  { valor: "LIGACAO", rotulo: "Ligação" },
  { valor: "WHATSAPP", rotulo: "WhatsApp" },
  { valor: "EMAIL", rotulo: "E-mail" },
  { valor: "REUNIAO", rotulo: "Reunião" },
  { valor: "VISITA", rotulo: "Visita à marina" },
  { valor: "SEA_TRIAL", rotulo: "Sea trial" },
  { valor: "NOTA", rotulo: "Anotação" },
];

export const rotuloInteracao: Record<TipoInteracao, string> = {
  LIGACAO: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  REUNIAO: "Reunião",
  VISITA: "Visita à marina",
  SEA_TRIAL: "Sea trial",
  NOTA: "Anotação",
  MUDANCA_ETAPA: "Mudança de etapa",
  PROPOSTA: "Proposta",
};

export const rotuloCondicao: Record<Condicao, string> = { NOVO: "Novo", SEMINOVO: "Seminovo" };

export const rotuloStatusEmbarcacao: Record<StatusEmbarcacao, string> = {
  DISPONIVEL: "Disponível",
  RESERVADA: "Reservada",
  VENDIDA: "Vendida",
  ENCOMENDA: "Sob encomenda",
};

export const rotuloStatusProposta: Record<StatusProposta, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
};

export const ORIGENS = [
  "Indicação",
  "Evento / boat show",
  "Instagram",
  "Site Regatta Yachts",
  "RD Station",
  "Loja / showroom",
  "Cliente da casa",
  "Outro",
];

export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
