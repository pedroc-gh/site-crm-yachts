import Link from "next/link";
import type { Etapa, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { escopoVendedor, exigirUsuario } from "@/lib/auth";
import { ETAPAS, rotuloCondicao } from "@/lib/rotulos";
import { data, reais, telefone } from "@/lib/formato";
import { TagEtapa } from "@/components/Tags";

export const metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const u = await exigirUsuario();
  const { q = "", etapa = "", vendedor = "" } = await searchParams;

  const where: Prisma.ClienteWhereInput = { ...escopoVendedor(u) };
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q.replace(/\D/g, "") || q } },
      { modeloInteresse: { contains: q, mode: "insensitive" } },
      { cidade: { contains: q, mode: "insensitive" } },
    ];
  }
  if (etapa) where.etapa = etapa as Etapa;
  if (vendedor && u.papel === "ADMIN") where.vendedorId = vendedor;

  const [clientes, vendedores] = await Promise.all([
    db.cliente.findMany({
      where,
      include: { vendedor: { select: { nome: true } } },
      orderBy: [{ atualizadoEm: "desc" }],
      take: 300,
    }),
    u.papel === "ADMIN" ? db.usuario.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }) : [],
  ]);
  const hoje = new Date(new Date().toDateString());

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">{u.papel === "ADMIN" ? "Todas as carteiras" : "Sua carteira"}</p>
          <h1 className="display display-lg">Clientes</h1>
        </div>
        <div className="acoes">
          <Link href="/clientes/novo" className="btn btn-cta">Novo cliente</Link>
        </div>
      </header>

      <form className="filtros" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar nome, telefone, modelo, cidade" aria-label="Buscar clientes" />
        <select name="etapa" defaultValue={etapa} aria-label="Etapa">
          <option value="">Todas as etapas</option>
          {ETAPAS.map((e) => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
        </select>
        {u.papel === "ADMIN" && (
          <select name="vendedor" defaultValue={vendedor} aria-label="Consultor">
            <option value="">Todos os consultores</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        )}
        <button className="btn btn-sm" type="submit">Filtrar</button>
        {(q || etapa || vendedor) && <Link className="btn btn-texto btn-sm" href="/clientes">Limpar</Link>}
        <span className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>{clientes.length} cliente(s)</span>
      </form>

      {clientes.length === 0 ? (
        <div className="vazio">
          <p className="display display-sm">Nenhum cliente encontrado</p>
          <p>{q || etapa ? "Ajuste os filtros ou limpe a busca." : "Cadastre o primeiro cliente da sua carteira."}</p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Interesse</th>
                <th className="direita">Orçamento</th>
                <th>Etapa</th>
                <th>Próximo contato</th>
                {u.papel === "ADMIN" && <th>Consultor</th>}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const atrasado = c.proximoContato && c.proximoContato < hoje && !["GANHO", "PERDIDO"].includes(c.etapa);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link className="linha" href={`/clientes/${c.id}`}>{c.nome}</Link>
                      <div className="muted" style={{ fontSize: 12 }}>{[c.cidade, c.uf].filter(Boolean).join(" / ") || "—"}</div>
                    </td>
                    <td className="num">{telefone(c.telefone)}<div className="muted" style={{ fontSize: 12 }}>{c.email ?? ""}</div></td>
                    <td>
                      {c.modeloInteresse ?? "—"}
                      <div className="muted" style={{ fontSize: 12 }}>{c.interesse ? rotuloCondicao[c.interesse] : "A definir"}</div>
                    </td>
                    <td className="direita num">{c.orcamento ? reais(c.orcamento) : "—"}</td>
                    <td><TagEtapa etapa={c.etapa} /></td>
                    <td className="num" style={atrasado ? { color: "var(--perigo)", fontWeight: 600 } : undefined}>
                      {data(c.proximoContato)}{atrasado ? " · atrasado" : ""}
                    </td>
                    {u.papel === "ADMIN" && <td>{c.vendedor.nome}</td>}
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
