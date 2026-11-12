import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { data, numeroProposta, reais } from "@/lib/formato";
import { TagCondicao, TagStatusEmbarcacao, TagStatusProposta } from "@/components/Tags";
import { FormEmbarcacao } from "../FormEmbarcacao";
import { excluirEmbarcacao, fotoPrincipal, removerFoto } from "../actions";

export default async function Embarcacao({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const u = await exigirUsuario();
  const { id } = await params;
  const { salvo, erro } = await searchParams;
  const b = await db.embarcacao.findUnique({
    where: { id },
    include: {
      fotos: { select: { id: true }, orderBy: { ordem: "asc" } },
      propostas: {
        where: u.papel === "ADMIN" ? {} : { vendedorId: u.id },
        include: { cliente: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!b) notFound();

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">{b.marca}</p>
          <h1 className="display display-lg">{b.modelo}</h1>
          <div className="linha-flex"><TagCondicao condicao={b.condicao} /><TagStatusEmbarcacao status={b.status} /><span className="preco">{reais(b.preco)}</span></div>
        </div>
        <div className="acoes">
          <Link className="btn btn-cta" href={`/propostas/nova?embarcacao=${b.id}`}>Gerar proposta</Link>
        </div>
      </header>
      {salvo && <p className="aviso aviso-ok" role="status">Embarcação salva.</p>}
      {erro === "proposta" && <p className="aviso" role="alert">Há propostas com esta embarcação. Marque-a como vendida em vez de excluir.</p>}

      {b.fotos.length > 0 && (
        <section className="secao" style={{ marginBottom: 40 }}>
          <header><h2 className="display display-sm">Fotos</h2><span className="muted" style={{ fontSize: 13 }}>A primeira é a capa da proposta</span></header>
          <div className="fotos-edicao">
            {b.fotos.map((f, i) => (
              <figure key={f.id}>
                <img src={`/api/fotos/${f.id}`} alt={`${b.modelo}, foto ${i + 1}`} />
                <figcaption>
                  {i === 0 ? <span>CAPA</span> : (
                    <form action={fotoPrincipal}><input type="hidden" name="fotoId" value={f.id} /><button className="btn btn-texto btn-sm" style={{ minHeight: 24, padding: 0 }}>Usar na capa</button></form>
                  )}
                  <form action={removerFoto}><input type="hidden" name="fotoId" value={f.id} /><button className="btn btn-texto btn-sm" style={{ minHeight: 24, padding: 0, color: "var(--perigo)" }}>Remover</button></form>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {b.propostas.length > 0 && (
        <section className="secao" style={{ marginBottom: 40 }}>
          <header><h2 className="display display-sm">Propostas com este barco</h2></header>
          <ul className="lista-simples">
            {b.propostas.map((p) => (
              <li key={p.id}>
                <div><Link href={`/propostas/${p.id}`}><strong>{numeroProposta(p.numero, p.criadoEm)}</strong></Link> · {p.cliente.nome}<div className="muted" style={{ fontSize: 12 }}>{data(p.criadoEm)} · {reais(p.valorFinal)}</div></div>
                <TagStatusProposta status={p.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="secao">
        <header><h2 className="display display-sm">Dados da embarcação</h2></header>
        <FormEmbarcacao
          e={{
            ...b,
            comprimentoPes: b.comprimentoPes ? b.comprimentoPes.toString().replace(".", ",") : null,
            preco: Number(b.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          }}
        />
      </section>

      {u.papel === "ADMIN" && (
        <form action={excluirEmbarcacao} style={{ marginTop: 40 }}>
          <input type="hidden" name="id" value={b.id} />
          <button className="btn btn-perigo btn-sm">Excluir embarcação</button>
        </form>
      )}
    </>
  );
}
