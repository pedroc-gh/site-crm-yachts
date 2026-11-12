"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { salvarProposta } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { calcularProposta, lerValor, reais } from "@/lib/formato";

type Opcao = { id: string; rotulo: string };
type Barco = Opcao & { preco: number; condicao: "NOVO" | "SEMINOVO"; status: string };

export type PropostaForm = {
  id?: string;
  clienteId: string;
  embarcacaoId: string;
  valorTabela: string;
  opcionais: string;
  desconto: string;
  barcoTroca: string;
  valorTroca: string;
  entrada: string;
  parcelas: string;
  formaPagamento: string;
  prazoEntrega: string;
  localEntrega: string;
  validade: string;
  observacoes: string;
};

const br = (n: number) => (n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

export function FormProposta({ inicial, clientes, barcos }: { inicial: PropostaForm; clientes: Opcao[]; barcos: Barco[] }) {
  const [erro, acao] = useActionState(salvarProposta, null);
  const [v, setV] = useState(inicial);
  const set = (k: keyof PropostaForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const barco = barcos.find((b) => b.id === v.embarcacaoId);
  const calc = useMemo(
    () =>
      calcularProposta({
        valorTabela: lerValor(v.valorTabela),
        opcionais: v.opcionais,
        desconto: lerValor(v.desconto),
        valorTroca: lerValor(v.valorTroca),
        entrada: lerValor(v.entrada),
        parcelas: parseInt(v.parcelas, 10) || 0,
      }),
    [v],
  );

  function escolherBarco(e: React.ChangeEvent<HTMLSelectElement>) {
    const b = barcos.find((x) => x.id === e.target.value);
    setV((s) => ({
      ...s,
      embarcacaoId: e.target.value,
      valorTabela: b ? br(b.preco) : s.valorTabela,
      prazoEntrega: s.prazoEntrega || (b?.condicao === "SEMINOVO" ? "Imediata, após quitação" : ""),
    }));
  }

  const descontoPct = lerValor(v.valorTabela) > 0 ? (lerValor(v.desconto) / lerValor(v.valorTabela)) * 100 : 0;

  return (
    <FormAcao acao={acao} className="form" style={{ maxWidth: 1180 }}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <p className="aviso-obrigatorios"><span aria-hidden="true">*</span> Campos obrigatórios</p>
      <div className="duas-colunas">
        <div className="pilha" style={{ gap: 24 }}>
          <fieldset>
            <legend className="eyebrow">Cliente e embarcação</legend>
            <div className="campos">
              <div className="campo">
                <label htmlFor="clienteId">Cliente</label>
                <select id="clienteId" name="clienteId" value={v.clienteId} onChange={set("clienteId")} required>
                  <option value="">Escolha…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="embarcacaoId">Embarcação</label>
                <select id="embarcacaoId" name="embarcacaoId" value={v.embarcacaoId} onChange={escolherBarco} required>
                  <option value="">Escolha…</option>
                  <optgroup label="Novos">
                    {barcos.filter((b) => b.condicao === "NOVO").map((b) => <option key={b.id} value={b.id}>{b.rotulo}</option>)}
                  </optgroup>
                  <optgroup label="Seminovos">
                    {barcos.filter((b) => b.condicao === "SEMINOVO").map((b) => <option key={b.id} value={b.id}>{b.rotulo}</option>)}
                  </optgroup>
                </select>
                {barco && barco.status !== "DISPONIVEL" && barco.status !== "ENCOMENDA" && (
                  <span className="ajuda" style={{ color: "var(--perigo)" }}>Atenção: esta embarcação está {barco.status === "RESERVADA" ? "reservada" : "vendida"}.</span>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow">Valores</legend>
            <div className="campos">
              <div className="campo">
                <label htmlFor="valorTabela">Valor da embarcação (R$)</label>
                <input id="valorTabela" name="valorTabela" inputMode="decimal" value={v.valorTabela} onChange={set("valorTabela")} required />
                <span className="ajuda">Preenchido com o preço do estoque. Ajuste se necessário.</span>
              </div>
              <div className="campo">
                <label htmlFor="desconto">Desconto (R$)</label>
                <input id="desconto" name="desconto" inputMode="decimal" value={v.desconto} onChange={set("desconto")} />
                {descontoPct > 0 && <span className="ajuda">{descontoPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% sobre o valor da embarcação</span>}
              </div>
              <div className="campo campo-largo">
                <label htmlFor="opcionais">Opcionais e acessórios</label>
                <textarea id="opcionais" name="opcionais" rows={4} value={v.opcionais} onChange={set("opcionais")} placeholder={"Um por linha, valor depois da barra\nGerador Onan 9 kW | 85.000,00\nTeto rígido com solar | 120.000,00\nKit de segurança (incluso)"} />
              </div>
              <div className="campo">
                <label htmlFor="barcoTroca">Barco na troca</label>
                <input id="barcoTroca" name="barcoTroca" value={v.barcoTroca} onChange={set("barcoTroca")} placeholder="Modelo, ano e horas" />
              </div>
              <div className="campo">
                <label htmlFor="valorTroca">Valor de avaliação da troca (R$)</label>
                <input id="valorTroca" name="valorTroca" inputMode="decimal" value={v.valorTroca} onChange={set("valorTroca")} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow">Pagamento e entrega</legend>
            <div className="campos">
              <div className="campo">
                <label htmlFor="entrada">Entrada / sinal (R$)</label>
                <input id="entrada" name="entrada" inputMode="decimal" value={v.entrada} onChange={set("entrada")} />
              </div>
              <div className="campo">
                <label htmlFor="parcelas">Parcelas do saldo</label>
                <input id="parcelas" name="parcelas" type="number" min={0} max={120} value={v.parcelas} onChange={set("parcelas")} />
                <span className="ajuda">0 = saldo à vista</span>
              </div>
              <div className="campo campo-largo">
                <label htmlFor="formaPagamento">Condições de pagamento</label>
                <input id="formaPagamento" name="formaPagamento" value={v.formaPagamento} onChange={set("formaPagamento")} placeholder="Sinal na assinatura, saldo em parcelas mensais sem juros" />
              </div>
              <div className="campo">
                <label htmlFor="prazoEntrega">Prazo de entrega</label>
                <input id="prazoEntrega" name="prazoEntrega" value={v.prazoEntrega} onChange={set("prazoEntrega")} placeholder="Março de 2027" />
              </div>
              <div className="campo">
                <label htmlFor="localEntrega">Local de entrega</label>
                <input id="localEntrega" name="localEntrega" value={v.localEntrega} onChange={set("localEntrega")} placeholder="Marina, cidade" />
              </div>
              <div className="campo">
                <label htmlFor="validade">Proposta válida até</label>
                <input id="validade" name="validade" type="date" value={v.validade} onChange={set("validade")} required />
              </div>
              <div className="campo campo-largo">
                <label htmlFor="observacoes">Observações para o cliente</label>
                <textarea id="observacoes" name="observacoes" value={v.observacoes} onChange={set("observacoes")} placeholder="Revisão completa, garantia, documentação, transporte..." />
              </div>
            </div>
          </fieldset>
        </div>

        <aside className="secao" style={{ position: "sticky", top: 24 }}>
          <header><h2 className="display display-sm">Resumo</h2></header>
          {barco && <p className="model-name" style={{ fontSize: 22, margin: 0 }}>{barco.rotulo.split(" · ")[0]}</p>}
          <div className="resumo-valores">
            <div><span>Embarcação</span><span>{reais(lerValor(v.valorTabela))}</span></div>
            <div><span>Opcionais</span><span>{reais(calc.valorOpcionais)}</span></div>
            <div><span>Desconto</span><span>− {reais(lerValor(v.desconto))}</span></div>
            <div><span>Barco na troca</span><span>− {reais(lerValor(v.valorTroca))}</span></div>
            <div className="total"><span>Valor final</span><span>{reais(calc.valorFinal)}</span></div>
            <div><span>Entrada</span><span>{reais(lerValor(v.entrada))}</span></div>
            <div>
              <span>Saldo</span>
              <span>{(parseInt(v.parcelas, 10) || 0) > 0 ? `${v.parcelas}x de ${reais(calc.valorParcela)}` : reais(calc.saldo)}</span>
            </div>
          </div>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <div className="linha-flex">
            <BotaoEnviar>{v.id ? "Salvar proposta" : "Gerar proposta"}</BotaoEnviar>
            <Link className="btn" href={v.id ? `/propostas/${v.id}` : "/propostas"}>Cancelar</Link>
          </div>
        </aside>
      </div>
    </FormAcao>
  );
}
