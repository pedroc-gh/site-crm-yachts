import type { Proposta, Cliente, Embarcacao, Usuario } from "@prisma/client";
import { data, lerOpcionais, num, numeroProposta, reais, telefone } from "@/lib/formato";
import { rotuloCondicao, MAX_ITENS } from "@/lib/rotulos";

type Props = {
  p: Proposta & {
    cliente: Cliente;
    embarcacao: Embarcacao & { fotos: { id: string }[] };
    vendedor: Pick<Usuario, "nome" | "email" | "telefone">;
  };
};

export function DocumentoProposta({ p }: Props) {
  const b = p.embarcacao;
  const capa = b.fotos[0] ? `/api/fotos/${b.fotos[0].id}` : null;
  const opcionais = lerOpcionais(p.opcionais);
  const equipamentos = (b.equipamentos ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, MAX_ITENS);
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
  const numero = numeroProposta(p.numero, p.criadoEm);

  return (
    <div className="doc-rolagem">
      <article className="doc">
        {/* Página 1: capa */}
        <section className="pagina">
          <div className="doc-capa" style={capa ? { backgroundImage: `url(${capa})` } : undefined}>
            <img className="doc-logo" src="/brand/logo-branco.svg" alt="Regatta Yachts" />
            <div>
              <p className="doc-eyebrow">Proposta comercial · {rotuloCondicao[b.condicao]}</p>
              <h1 className="doc-modelo">{b.modelo}</h1>
              <div className="doc-filete" />
              <p className="doc-numero">Nº {numero} · emitida em {data(p.criadoEm)}</p>
            </div>
          </div>
          <div className="doc-bloco doc-partes">
            <div>
              <p className="doc-rotulo">Preparada para</p>
              <p className="doc-nome">{p.cliente.nome}</p>
              <p className="doc-texto">
                {[p.cliente.cidade, p.cliente.uf].filter(Boolean).join(" / ")}
                {p.cliente.cpfCnpj ? <><br />CPF/CNPJ {p.cliente.cpfCnpj}</> : null}
              </p>
            </div>
            <div>
              <p className="doc-rotulo">Seu consultor</p>
              <p className="doc-nome">{p.vendedor.nome}</p>
              <p className="doc-texto">
                {p.vendedor.telefone ? <>{telefone(p.vendedor.telefone)}<br /></> : null}
                {p.vendedor.email}
              </p>
            </div>
          </div>
          {b.descricao && (
            <div className="doc-bloco" style={{ borderBottom: 0 }}>
              <p className="doc-lead">{b.descricao}</p>
            </div>
          )}
          <span className="doc-num-pagina">1 / 3</span>
        </section>

        {/* Página 2: ficha técnica e itens */}
        <section className="pagina">
          <div className="doc-bloco doc-gelo">
            <h2 className="doc-titulo">Ficha técnica</h2>
            <dl className="doc-ficha">
              {ficha.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
          {equipamentos.length > 0 && (
            <div className="doc-bloco" style={{ borderBottom: 0 }}>
              <h2 className="doc-titulo">Itens e equipamentos</h2>
              <ul className="doc-equip">{equipamentos.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
          <span className="doc-num-pagina">2 / 3</span>
        </section>

        {/* Página 3: investimento e condições */}
        <section className="pagina pagina-final">
          <div className="doc-bloco">
            <h2 className="doc-titulo">Investimento</h2>
            <table className="doc-valores">
              <tbody>
                <tr><td>{b.modelo}{b.ano ? ` · ${b.ano}` : ""}</td><td>{reais(p.valorTabela)}</td></tr>
                {opcionais.map((o, i) => (
                  <tr key={i}><td>{o.item}</td><td>{o.valor > 0 ? reais(o.valor) : "Incluso"}</td></tr>
                ))}
                {num(p.desconto) > 0 && <tr><td>Desconto especial</td><td>− {reais(p.desconto)}</td></tr>}
                {num(p.valorTroca) > 0 && <tr><td>Embarcação na troca{p.barcoTroca ? ` · ${p.barcoTroca}` : ""}</td><td>− {reais(p.valorTroca)}</td></tr>}
              </tbody>
            </table>
            <div className="doc-total">
              <span>Valor final</span>
              <strong>{reais(p.valorFinal)}</strong>
            </div>
          </div>
          <div className="doc-bloco" style={{ borderBottom: 0 }}>
            <h2 className="doc-titulo">Condições</h2>
            <dl className="doc-ficha doc-condicoes">
              {num(p.entrada) > 0 && <div><dt>Entrada</dt><dd>{reais(p.entrada)}</dd></div>}
              <div>
                <dt>Saldo</dt>
                <dd>{p.parcelas > 0 ? `${p.parcelas}x de ${reais(p.valorParcela)}` : `${reais(num(p.valorFinal) - num(p.entrada))} à vista`}</dd>
              </div>
              {p.formaPagamento && <div className="largo"><dt>Pagamento</dt><dd>{p.formaPagamento}</dd></div>}
              {p.prazoEntrega && <div><dt>Entrega</dt><dd>{p.prazoEntrega}</dd></div>}
              {p.localEntrega && <div><dt>Local de entrega</dt><dd>{p.localEntrega}</dd></div>}
              <div><dt>Validade</dt><dd>{data(p.validade)}</dd></div>
            </dl>
            {p.observacoes && <p className="doc-texto doc-obs">{p.observacoes}</p>}
          </div>
          <div className="doc-fecho">
            <p className="doc-fecho-titulo">Navegue a sua história</p>
            <p className="doc-fecho-texto">Você não compra um iate. Você vive uma história.</p>
            <p className="doc-fecho-contato">{p.vendedor.nome}{p.vendedor.telefone ? ` · ${telefone(p.vendedor.telefone)}` : ""} · {p.vendedor.email}</p>
          </div>
          <footer className="doc-rodape">Regatta Yachts · Excelência náutica · www.regattayachts.com.br</footer>
        </section>
      </article>
    </div>
  );
}
