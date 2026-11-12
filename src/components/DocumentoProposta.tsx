import type { Proposta, Cliente, Embarcacao, Usuario, PapelFoto } from "@prisma/client";
import { data, lerOpcionais, num, numeroProposta, reais, telefone } from "@/lib/formato";
import { rotuloCondicao, MAX_ITENS, MAX_DETALHES } from "@/lib/rotulos";
import { AjustePagina } from "./AjustePagina";

type Props = {
  p: Proposta & {
    cliente: Cliente;
    embarcacao: Embarcacao & { fotos: { id: string; papel: PapelFoto }[] };
    vendedor: Pick<Usuario, "nome" | "email" | "telefone">;
  };
};

/**
 * Proposta em UMA folha A4 (210 × 297 mm).
 * Hierarquia: 1) modelo  2) valor final  3) títulos de seção  4) nomes  5) rótulos e dados.
 * O corpo reduz a escala do texto sozinho (AjustePagina) se o conteúdo não couber.
 */
export function DocumentoProposta({ p }: Props) {
  const b = p.embarcacao;
  const principal = b.fotos.find((f) => f.papel === "PRINCIPAL");
  const detalhes = b.fotos.filter((f) => f.papel === "DETALHE").slice(0, MAX_DETALHES);
  const opcionais = lerOpcionais(p.opcionais);
  const itens = (b.equipamentos ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, MAX_ITENS);
  const ficha = [
    ["Estaleiro", b.marca],
    ["Ano", b.ano],
    ["Comprimento", b.comprimentoPes ? `${num(b.comprimentoPes).toLocaleString("pt-BR")} pés` : null],
    ["Motorização", b.motorizacao],
    ["Horas de motor", b.condicao === "SEMINOVO" && b.horasMotor != null ? `${b.horasMotor} h` : null],
    ["Combustível", b.combustivel],
    ["Cabines", b.cabines],
    ["Capacidade", b.capacidade ? `${b.capacidade} pessoas` : null],
    ["Cor do casco", b.cor],
    ["Localização", b.localizacao],
  ].filter(([, v]) => v != null && v !== "") as [string, string | number][];
  const saldo = num(p.valorFinal) - num(p.entrada);

  return (
    <div className="doc-rolagem">
      <article className="folha" id="folha-proposta">
        <header className="f-topo">
          <img className="f-logo" src="/brand/logo-branco.svg" alt="Regatta Yachts" />
          <div className="f-topo-dados">
            <span>Proposta comercial</span>
            <span>Nº {numeroProposta(p.numero, p.criadoEm)} · {data(p.criadoEm)}</span>
          </div>
        </header>

        <section className="f-hero" style={principal ? { backgroundImage: `url(/api/fotos/${principal.id})` } : undefined}>
          <div className="f-hero-texto">
            <p className="f-hero-eyebrow">
              {[b.marca, rotuloCondicao[b.condicao], b.ano].filter(Boolean).join(" · ")}
            </p>
            <h1 className="f-modelo">{b.modelo}</h1>
            <div className="f-filete" />
            {b.descricao && <p className="f-hero-lead">{b.descricao}</p>}
          </div>
        </section>

        {detalhes.length > 0 && (
          <section className="f-detalhes" style={{ gridTemplateColumns: `repeat(${detalhes.length}, 1fr)` }}>
            {detalhes.map((f, i) => (
              <img key={f.id} src={`/api/fotos/${f.id}`} alt={`${b.modelo}, detalhe ${i + 1}`} />
            ))}
          </section>
        )}

        <section className="f-partes">
          <div>
            <p className="f-rotulo">Preparada para</p>
            <p className="f-nome">{p.cliente.nome}</p>
            <p className="f-dado">{[p.cliente.cidade, p.cliente.uf].filter(Boolean).join(" / ") || " "}</p>
          </div>
          <div>
            <p className="f-rotulo">Seu consultor</p>
            <p className="f-nome">{p.vendedor.nome}</p>
            <p className="f-dado">{[p.vendedor.telefone && telefone(p.vendedor.telefone), p.vendedor.email].filter(Boolean).join(" · ")}</p>
          </div>
          <div>
            <p className="f-rotulo">Válida até</p>
            <p className="f-nome">{data(p.validade)}</p>
            <p className="f-dado">{p.prazoEntrega ? `Entrega: ${p.prazoEntrega}` : " "}</p>
          </div>
        </section>

        <section className="f-corpo" data-ajuste>
          <div className="f-linha">
            <div className="f-col">
              <div>
                <h2 className="f-titulo">Ficha técnica</h2>
                <dl className="f-ficha">
                  {ficha.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </div>
              <div>
                <h2 className="f-titulo">Condições</h2>
                <dl className="f-ficha f-condicoes">
                  {num(p.entrada) > 0 && <div><dt>Entrada</dt><dd>{reais(p.entrada)}</dd></div>}
                  <div>
                    <dt>Saldo</dt>
                    <dd>{p.parcelas > 0 ? `${p.parcelas}x de ${reais(p.valorParcela)}` : `${reais(saldo)} à vista`}</dd>
                  </div>
                  {p.formaPagamento && <div className="largo"><dt>Pagamento</dt><dd>{p.formaPagamento}</dd></div>}
                  {p.localEntrega && <div className="largo"><dt>Local de entrega</dt><dd>{p.localEntrega}</dd></div>}
                </dl>
                {p.observacoes && <p className="f-obs">{p.observacoes}</p>}
              </div>
            </div>

            <div className="f-col">
              <div>
                <h2 className="f-titulo">Investimento</h2>
                <table className="f-valores">
                  <tbody>
                    <tr><td>{b.modelo}{b.ano ? ` · ${b.ano}` : ""}</td><td>{reais(p.valorTabela)}</td></tr>
                    {opcionais.map((o, i) => (
                      <tr key={i}><td>{o.item}</td><td>{o.valor > 0 ? reais(o.valor) : "Incluso"}</td></tr>
                    ))}
                    {num(p.desconto) > 0 && <tr><td>Desconto especial</td><td>− {reais(p.desconto)}</td></tr>}
                    {num(p.valorTroca) > 0 && (
                      <tr><td>Embarcação na troca{p.barcoTroca ? ` · ${p.barcoTroca}` : ""}</td><td>− {reais(p.valorTroca)}</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="f-total">
                  <span>Valor final</span>
                  <strong>{reais(p.valorFinal)}</strong>
                </div>
              </div>
            </div>
          </div>

          {itens.length > 0 && (
            <div>
              <h2 className="f-titulo">Itens e equipamentos</h2>
              <ul className="f-itens">{itens.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
        </section>

        <footer className="f-rodape">
          <div className="f-fecho">
            <span className="f-fecho-titulo">Navegue a sua história</span>
            <span className="f-fecho-contato">
              {p.vendedor.nome}{p.vendedor.telefone ? ` · ${telefone(p.vendedor.telefone)}` : ""}
            </span>
          </div>
          <div className="f-assinatura">Regatta Yachts · Excelência náutica · www.regattayachts.com.br</div>
        </footer>
        <AjustePagina />
      </article>
    </div>
  );
}
