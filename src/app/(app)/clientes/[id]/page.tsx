import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { rotuloCondicao, rotuloInteracao } from "@/lib/rotulos";
import { data, dataHora, linkWhatsapp, numeroProposta, reais, telefone } from "@/lib/formato";
import { TagEtapa, TagStatusProposta } from "@/components/Tags";
import { TrilhaEtapas } from "./TrilhaEtapas";
import { NovaInteracao } from "./NovaInteracao";
import { excluirCliente } from "../actions";

export default async function FichaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const u = await exigirUsuario();
  const { id } = await params;
  const { erro } = await searchParams;
  const c = await db.cliente.findUnique({
    where: { id },
    include: {
      vendedor: { select: { nome: true } },
      interacoes: { include: { usuario: { select: { nome: true } } }, orderBy: { data: "desc" } },
      propostas: { include: { embarcacao: { select: { modelo: true, condicao: true } } }, orderBy: { criadoEm: "desc" } },
    },
  });
  if (!c || (u.papel !== "ADMIN" && c.vendedorId !== u.id)) notFound();
  const wpp = linkWhatsapp(c.telefone);

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">
            Cliente · desde {data(c.criadoEm)}
            {u.papel === "ADMIN" ? ` · ${c.vendedor.nome}` : ""}
          </p>
          <h1 className="display display-lg">{c.nome}</h1>
          <div className="linha-flex"><TagEtapa etapa={c.etapa} />{c.motivoPerda && c.etapa === "PERDIDO" && <span className="muted" style={{ fontSize: 13 }}>Motivo: {c.motivoPerda}</span>}</div>
        </div>
        <div className="acoes">
          {wpp && <a className="btn" href={wpp} target="_blank" rel="noreferrer">WhatsApp</a>}
          <Link className="btn" href={`/clientes/${c.id}/editar`}>Editar</Link>
          <Link className="btn btn-cta" href={`/propostas/nova?cliente=${c.id}`}>Gerar proposta</Link>
        </div>
      </header>

      {erro === "proposta" && <p className="aviso" role="alert">Este cliente tem propostas e não pode ser excluído. Marque-o como perdido.</p>}

      <TrilhaEtapas clienteId={c.id} etapa={c.etapa} />

      <div className="ficha">
        <div className="pilha" style={{ gap: 40 }}>
          <section className="secao">
            <header><h2 className="display display-sm">Dados</h2></header>
            <dl className="dados">
              <div><dt>Telefone</dt><dd className="num">{telefone(c.telefone)}</dd></div>
              <div><dt>E-mail</dt><dd>{c.email ?? "—"}</dd></div>
              <div><dt>CPF / CNPJ</dt><dd className="num">{c.cpfCnpj ?? "—"}</dd></div>
              <div><dt>Nascimento</dt><dd className="num">{data(c.dataNascimento)}</dd></div>
              <div><dt>Cidade</dt><dd>{[c.cidade, c.uf].filter(Boolean).join(" / ") || "—"}</dd></div>
              <div><dt>Profissão</dt><dd>{c.profissao ?? "—"}</dd></div>
              <div><dt>Origem</dt><dd>{c.origem ?? "—"}</dd></div>
              <div><dt>Próximo contato</dt><dd className="num">{data(c.proximoContato)}</dd></div>
            </dl>
          </section>
          <section className="secao">
            <header><h2 className="display display-sm">Perfil de compra</h2></header>
            <dl className="dados">
              <div><dt>Interesse</dt><dd>{c.interesse ? rotuloCondicao[c.interesse] : "A definir"}</dd></div>
              <div><dt>Modelo</dt><dd>{c.modeloInteresse ?? "—"}</dd></div>
              <div><dt>Orçamento</dt><dd className="preco">{c.orcamento ? reais(c.orcamento) : "—"}</dd></div>
              <div><dt>Barco atual</dt><dd>{c.possuiBarco ?? "—"}</dd></div>
              {c.observacoes && <div className="largo"><dt>Observações</dt><dd style={{ whiteSpace: "pre-wrap" }}>{c.observacoes}</dd></div>}
            </dl>
          </section>
          <section className="secao">
            <header>
              <h2 className="display display-sm">Propostas</h2>
              <Link href={`/propostas/nova?cliente=${c.id}`} className="btn btn-texto btn-sm">Nova</Link>
            </header>
            {c.propostas.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Nenhuma proposta ainda.</p>
            ) : (
              <ul className="lista-simples">
                {c.propostas.map((p) => (
                  <li key={p.id}>
                    <div>
                      <Link href={`/propostas/${p.id}`}><strong>{numeroProposta(p.numero, p.criadoEm)}</strong></Link>{" "}
                      · {p.embarcacao.modelo}
                      <div className="muted" style={{ fontSize: 12 }}>{data(p.criadoEm)} · {reais(p.valorFinal)}</div>
                    </div>
                    <TagStatusProposta status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          {u.papel === "ADMIN" && (
            <form action={excluirCliente}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn btn-perigo btn-sm" type="submit">Excluir cliente</button>
            </form>
          )}
        </div>

        <section className="secao">
          <header><h2 className="display display-sm">Histórico do atendimento</h2><span className="muted" style={{ fontSize: 13 }}>{c.interacoes.length} registro(s)</span></header>
          <NovaInteracao clienteId={c.id} />
          <ol className="timeline">
            {c.interacoes.map((i) => (
              <li key={i.id}>
                <span className="quando">{dataHora(i.data)}</span>
                <div>
                  <span className="tipo">{rotuloInteracao[i.tipo]}</span>
                  <p>{i.descricao}</p>
                  <span className="autor">{i.usuario.nome}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
