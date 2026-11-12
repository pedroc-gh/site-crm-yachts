import type { Etapa, StatusEmbarcacao, StatusProposta, Condicao } from "@prisma/client";
import { rotuloEtapa, rotuloStatusEmbarcacao, rotuloStatusProposta, rotuloCondicao } from "@/lib/rotulos";

export function TagEtapa({ etapa }: { etapa: Etapa }) {
  const cls =
    etapa === "GANHO" ? "tag-ok" : etapa === "PERDIDO" ? "tag-neutro" : etapa === "NEGOCIACAO" || etapa === "PROPOSTA" ? "tag-alerta" : "tag-novo";
  return <span className={`tag ${cls}`}>{rotuloEtapa(etapa)}</span>;
}

export function TagCondicao({ condicao }: { condicao: Condicao }) {
  return <span className={`tag ${condicao === "NOVO" ? "tag-novo" : "tag-seminovo"}`}>{rotuloCondicao[condicao]}</span>;
}

export function TagStatusEmbarcacao({ status }: { status: StatusEmbarcacao }) {
  const cls = status === "DISPONIVEL" ? "tag-ok" : status === "RESERVADA" ? "tag-alerta" : status === "VENDIDA" ? "tag-neutro" : "tag-novo";
  return <span className={`tag ${cls}`}>{rotuloStatusEmbarcacao[status]}</span>;
}

export function TagStatusProposta({ status }: { status: StatusProposta }) {
  const cls =
    status === "ACEITA" ? "tag-ok" : status === "ENVIADA" ? "tag-alerta" : status === "RECUSADA" || status === "EXPIRADA" ? "tag-perigo" : "tag-neutro";
  return <span className={`tag ${cls}`}>{rotuloStatusProposta[status]}</span>;
}
