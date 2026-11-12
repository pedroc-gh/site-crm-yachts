import Link from "next/link";
import { db } from "@/lib/db";
import { escopoVendedor, exigirUsuario } from "@/lib/auth";
import { ETAPAS } from "@/lib/rotulos";
import { data, num, numeroProposta, reais, telefone } from "@/lib/formato";
import { TagEtapa, TagStatusProposta } from "@/components/Tags";

export const metadata = { title: "Painel" };

export default async function Painel({ searchParams }: { searchParams: Promise<{ senha?: string }> }) {
  const u = await exigirUsuario();
  const { senha } = await searchParams;
  const escopo = escopoVendedor(u);
  const hoje = new Date(new Date().toDateString());
  const em7 = new Date(hoje.getTime() + 8 * 864e5);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [porEtapa, agenda, abertas, vendasMes, recentes] = await Promise.all([
    db.cliente.groupBy({ by: ["etapa"], where: escopo, _count: true }),
    db.cliente.findMany({
      where: { ...escopo, etapa: { notIn: ["GANHO", "PERDIDO"] }, proximoContato: { lt: em7 } },
      orderBy: { proximoContato: "asc" },
      take: 12,
    }),
    db.proposta.aggregate({ where: { ...escopo, status: { in: ["RASCUNHO", "ENVIADA"] } }, _sum: { valorFinal: true }, _count: true }),
    db.proposta.aggregate({ where: { ...escopo, status: "ACEITA", atualizadoEm: { gte: inicioMes } }, _sum: { valorFinal: true }, _count: true }),
    db.proposta.findMany({
      where: escopo,
      include: { cliente: { select: { nome: true } }, embarcacao: { select: { modelo: true } } },
      orderBy: { criadoEm: "desc" },
      take: 6,
    }),
  ]);

  const contagem = Object.fromEntries(porEtapa.map((g) => [g.etapa, g._count])) as Record<string, number>;
  const emAtendimento = ETAPAS.filter((e) => e.valor !== "GANHO" && e.valor !== "PERDIDO").reduce((s, e) => s + (contagem[e.valor] ?? 0), 0);
  const maior = Math.max(1, ...Object.values(contagem));
  const atrasados = agenda.filter((c) => c.proximoContato! < hoje).length;
  const primeiroNome = u.nome.split(" ")[0];
  const mes = hoje.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">{hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="display display-lg">Olá, {primeiroNome}</h1>
        </div>
        <div className="acoes">
          <Link className="btn" href="/clientes/novo">Novo cliente</Link>
          <Link className="btn btn-cta" href="/propostas/nova">Nova proposta</Link>
        </div>
      </header>

      {senha === "ok" && <p className="aviso aviso-ok" role="status" style={{ marginBottom: 24 }}>Senha atualizada.</p>}

      <div className="kpis">
        <div className="kpi"><span className="label">Em atendimento</span><div className="valor">{emAtendimento}</div></div>
        <div className="kpi"><span className="label">Contatos atrasados</span><div className="valor" style={atrasados ? { color: "var(--perigo)" } : undefined}>{atrasados}</div></div>
        <div className="kpi"><span className="label">Propostas em aberto · {abertas._count}</span><div className="valor reais">{reais(abertas._sum.valorFinal)}</div></div>
        <div className="kpi"><span className="label">Vendido em {mes} · {vendasMes._count}</span><div className="valor reais">{reais(vendasMes._sum.valorFinal)}</div></div>
      </div>

      <div className="duas-colunas">
        <section className="secao">
          <header><h2 className="display display-sm">Agenda de contatos</h2><Link href="/funil" className="btn btn-texto btn-sm">Ver funil</Link></header>
          {agenda.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Nenhum contato previsto para os próximos 7 dias.</p>
          ) : (
            <ul className="lista-simples">
              {agenda.map((c) => {
                const atrasado = c.proximoContato! < hoje;
                return (
                  <li key={c.id}>
                    <div>
                      <Link href={`/clientes/${c.id}`}><strong>{c.nome}</strong></Link>
                      <div className="muted" style={{ fontSize: 12 }}>{[c.modeloInteresse, telefone(c.telefone)].filter((x) => x && x !== "—").join(" · ")}</div>
                    </div>
                    <div style={{ textAlign: "right", display: "grid", gap: 4, justifyItems: "end" }}>
                      <span className="num" style={atrasado ? { color: "var(--perigo)", fontWeight: 600, fontSize: 13 } : { fontSize: 13 }}>
                        {atrasado ? "Atrasado · " : ""}{data(c.proximoContato)}
                      </span>
                      <TagEtapa etapa={c.etapa} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="secao">
          <header><h2 className="display display-sm">Funil</h2></header>
          <div className="funil-barras">
            {ETAPAS.map((e) => (
              <div key={e.valor} className={`linha ${e.valor === "GANHO" ? "ganho" : e.valor === "PERDIDO" ? "perdido" : ""}`}>
                <span>{e.rotulo}</span>
                <div className="trilho"><div className="barra" style={{ width: `${((contagem[e.valor] ?? 0) / maior) * 100}%` }} /></div>
                <span className="num" style={{ textAlign: "right" }}>{contagem[e.valor] ?? 0}</span>
              </div>
            ))}
          </div>

          <header style={{ marginTop: 24 }}><h2 className="display display-sm">Últimas propostas</h2><Link href="/propostas" className="btn btn-texto btn-sm">Todas</Link></header>
          {recentes.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Nenhuma proposta ainda.</p>
          ) : (
            <ul className="lista-simples">
              {recentes.map((p) => (
                <li key={p.id}>
                  <div>
                    <Link href={`/propostas/${p.id}`}><strong>{numeroProposta(p.numero, p.criadoEm)}</strong></Link> · {p.embarcacao.modelo}
                    <div className="muted" style={{ fontSize: 12 }}>{p.cliente.nome} · {reais(num(p.valorFinal))}</div>
                  </div>
                  <TagStatusProposta status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
