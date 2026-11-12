import Link from "next/link";
import type { Prisma, StatusEmbarcacao } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { reais, num } from "@/lib/formato";
import { rotuloStatusEmbarcacao } from "@/lib/rotulos";
import { TagCondicao, TagStatusEmbarcacao } from "@/components/Tags";

export const metadata = { title: "Embarcações" };

export default async function Embarcacoes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirUsuario();
  const { tipo = "", status = "", q = "" } = await searchParams;
  const where: Prisma.EmbarcacaoWhereInput = {};
  if (tipo === "novos") where.condicao = "NOVO";
  if (tipo === "seminovos") where.condicao = "SEMINOVO";
  if (status) where.status = status as StatusEmbarcacao;
  else where.status = { not: "VENDIDA" };
  if (q) where.OR = [{ modelo: { contains: q, mode: "insensitive" } }, { marca: { contains: q, mode: "insensitive" } }];

  const barcos = await db.embarcacao.findMany({
    where,
    include: { fotos: { select: { id: true }, where: { papel: "PRINCIPAL" }, take: 1 } },
    orderBy: [{ condicao: "asc" }, { preco: "desc" }],
  });
  const aba = (t: string, rotulo: string) => {
    const qs = new URLSearchParams({ ...(t && { tipo: t }), ...(status && { status }), ...(q && { q }) }).toString();
    return <Link href={`/embarcacoes${qs ? "?" + qs : ""}`} aria-current={tipo === t ? "page" : undefined}>{rotulo}</Link>;
  };

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Estoque e catálogo</p>
          <h1 className="display display-lg">Embarcações</h1>
        </div>
        <div className="acoes">
          <Link className="btn" href="/embarcacoes/nova?condicao=SEMINOVO">Cadastrar seminovo</Link>
          <Link className="btn btn-cta" href="/embarcacoes/nova?condicao=NOVO">Cadastrar novo</Link>
        </div>
      </header>
      <nav className="abas" aria-label="Condição">{aba("", "Todas")}{aba("novos", "Novos")}{aba("seminovos", "Seminovos")}</nav>
      <form className="filtros" role="search">
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        <input type="search" name="q" defaultValue={q} placeholder="Buscar modelo ou marca" aria-label="Buscar embarcação" />
        <select name="status" defaultValue={status} aria-label="Situação">
          <option value="">Em estoque (sem vendidas)</option>
          {Object.entries(rotuloStatusEmbarcacao).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
        <button className="btn btn-sm">Filtrar</button>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>{barcos.length} embarcação(ões)</span>
      </form>

      {barcos.length === 0 ? (
        <div className="vazio">
          <p className="display display-sm">Nenhuma embarcação aqui</p>
          <p>Cadastre um barco novo do catálogo ou um seminovo para venda.</p>
        </div>
      ) : (
        <div className="grade-barcos">
          {barcos.map((b) => (
            <Link key={b.id} href={`/embarcacoes/${b.id}`} className="barco">
              <div className="foto">
                {b.fotos[0] ? <img src={`/api/fotos/${b.fotos[0].id}`} alt={b.modelo} loading="lazy" /> : <span className="sem-foto">SEM FOTO</span>}
                <TagCondicao condicao={b.condicao} />
              </div>
              <div className="info">
                <span className="eyebrow" style={{ fontSize: 10 }}>{b.marca}</span>
                <span className="model-name">{b.modelo}</span>
                <span className="specs">
                  {[b.ano, b.comprimentoPes && `${num(b.comprimentoPes).toLocaleString("pt-BR")} pés`, b.horasMotor != null && `${b.horasMotor} h de motor`, b.localizacao]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <div className="rodape">
                  <span className="preco">{reais(b.preco)}</span>
                  <TagStatusEmbarcacao status={b.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
