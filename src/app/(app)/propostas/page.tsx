import Link from "next/link";
import type { Prisma, StatusProposta } from "@prisma/client";
import { db } from "@/lib/db";
import { escopoVendedor, exigirUsuario } from "@/lib/auth";
import { data, numeroProposta, reais } from "@/lib/formato";
import { rotuloStatusProposta } from "@/lib/rotulos";
import { TagCondicao, TagStatusProposta } from "@/components/Tags";

export const metadata = { title: "Propostas" };

export default async function Propostas({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await exigirUsuario();
  const { status = "" } = await searchParams;
  const where: Prisma.PropostaWhereInput = { ...escopoVendedor(u), ...(status ? { status: status as StatusProposta } : {}) };
  const propostas = await db.proposta.findMany({
    where,
    include: {
      cliente: { select: { nome: true } },
      embarcacao: { select: { modelo: true, condicao: true } },
      vendedor: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 300,
  });
  const agora = new Date();

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Novos e seminovos</p>
          <h1 className="display display-lg">Propostas</h1>
        </div>
        <div className="acoes"><Link href="/propostas/nova" className="btn btn-cta">Nova proposta</Link></div>
      </header>
      <form className="filtros">
        <select name="status" defaultValue={status} aria-label="Situação">
          <option value="">Todas as situações</option>
          {Object.entries(rotuloStatusProposta).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
        <button className="btn btn-sm">Filtrar</button>
      </form>
      {propostas.length === 0 ? (
        <div className="vazio">
          <p className="display display-sm">Nenhuma proposta</p>
          <p>Abra a ficha de um cliente e use “Gerar proposta”.</p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº</th><th>Cliente</th><th>Embarcação</th><th className="direita">Valor final</th><th>Validade</th><th>Situação</th>
                {u.papel === "ADMIN" && <th>Consultor</th>}
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => {
                const vencida = p.validade < agora && (p.status === "ENVIADA" || p.status === "RASCUNHO");
                return (
                  <tr key={p.id}>
                    <td className="num"><Link className="linha" href={`/propostas/${p.id}`}>{numeroProposta(p.numero, p.criadoEm)}</Link><div className="muted" style={{ fontSize: 12 }}>{data(p.criadoEm)}</div></td>
                    <td>{p.cliente.nome}</td>
                    <td><span className="model-name" style={{ fontSize: 17, letterSpacing: "0.16em" }}>{p.embarcacao.modelo}</span> <TagCondicao condicao={p.embarcacao.condicao} /></td>
                    <td className="direita preco">{reais(p.valorFinal)}</td>
                    <td className="num" style={vencida ? { color: "var(--perigo)", fontWeight: 600 } : undefined}>{data(p.validade)}{vencida ? " · vencida" : ""}</td>
                    <td><TagStatusProposta status={p.status} /></td>
                    {u.papel === "ADMIN" && <td>{p.vendedor.nome}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
