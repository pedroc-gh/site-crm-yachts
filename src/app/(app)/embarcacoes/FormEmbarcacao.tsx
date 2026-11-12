"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { salvarEmbarcacao } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { rotuloStatusEmbarcacao } from "@/lib/rotulos";

export type EmbarcacaoForm = {
  id: string;
  condicao: "NOVO" | "SEMINOVO";
  marca: string;
  modelo: string;
  ano: number | null;
  comprimentoPes: string | null;
  motorizacao: string | null;
  horasMotor: number | null;
  combustivel: string | null;
  cabines: number | null;
  capacidade: number | null;
  cor: string | null;
  localizacao: string | null;
  inscricao: string | null;
  preco: string;
  status: keyof typeof rotuloStatusEmbarcacao;
  equipamentos: string | null;
  descricao: string | null;
};

export function FormEmbarcacao({ e, condicaoInicial }: { e?: EmbarcacaoForm; condicaoInicial?: "NOVO" | "SEMINOVO" }) {
  const [erro, acao] = useActionState(salvarEmbarcacao, null);
  const [condicao, setCondicao] = useState(e?.condicao ?? condicaoInicial ?? "NOVO");
  return (
    <form action={acao} className="form">
      {e && <input type="hidden" name="id" value={e.id} />}
      <fieldset>
        <legend className="eyebrow">Identificação</legend>
        <div className="campos">
          <div className="campo">
            <label htmlFor="condicao">Condição *</label>
            <select id="condicao" name="condicao" value={condicao} onChange={(ev) => setCondicao(ev.target.value as "NOVO" | "SEMINOVO")}>
              <option value="NOVO">Novo</option>
              <option value="SEMINOVO">Seminovo</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="marca">Marca / estaleiro *</label>
            <input id="marca" name="marca" list="marcas" defaultValue={e?.marca ?? "Sessa Marine"} required />
            <datalist id="marcas"><option value="Sessa Marine" /><option value="Phantom" /><option value="Schaefer" /><option value="Azimut" /><option value="Ferretti" /></datalist>
          </div>
          <div className="campo">
            <label htmlFor="modelo">Modelo *</label>
            <input id="modelo" name="modelo" placeholder="SESSA C68" defaultValue={e?.modelo} required />
          </div>
          <div className="campo">
            <label htmlFor="ano">Ano</label>
            <input id="ano" name="ano" inputMode="numeric" placeholder="2025" defaultValue={e?.ano ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="status">Situação</label>
            <select id="status" name="status" defaultValue={e?.status ?? (condicao === "NOVO" ? "ENCOMENDA" : "DISPONIVEL")}>
              {Object.entries(rotuloStatusEmbarcacao).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="preco">Preço de venda (R$) *</label>
            <input id="preco" name="preco" inputMode="decimal" placeholder="399.000,00" defaultValue={e?.preco ?? ""} required />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Ficha técnica</legend>
        <div className="campos">
          <div className="campo">
            <label htmlFor="comprimentoPes">Comprimento (pés)</label>
            <input id="comprimentoPes" name="comprimentoPes" inputMode="decimal" placeholder="68" defaultValue={e?.comprimentoPes ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="motorizacao">Motorização</label>
            <input id="motorizacao" name="motorizacao" placeholder="2x Volvo Penta IPS 950" defaultValue={e?.motorizacao ?? ""} />
          </div>
          {condicao === "SEMINOVO" && (
            <div className="campo">
              <label htmlFor="horasMotor">Horas de motor</label>
              <input id="horasMotor" name="horasMotor" inputMode="numeric" defaultValue={e?.horasMotor ?? ""} />
            </div>
          )}
          <div className="campo">
            <label htmlFor="combustivel">Combustível</label>
            <select id="combustivel" name="combustivel" defaultValue={e?.combustivel ?? "Diesel"}>
              <option>Diesel</option><option>Gasolina</option><option>Elétrico</option><option>Híbrido</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="cabines">Cabines</label>
            <input id="cabines" name="cabines" inputMode="numeric" defaultValue={e?.cabines ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="capacidade">Capacidade (pessoas)</label>
            <input id="capacidade" name="capacidade" inputMode="numeric" defaultValue={e?.capacidade ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="cor">Cor do casco</label>
            <input id="cor" name="cor" defaultValue={e?.cor ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="localizacao">Onde está</label>
            <input id="localizacao" name="localizacao" placeholder="Marina, cidade" defaultValue={e?.localizacao ?? ""} />
          </div>
          {condicao === "SEMINOVO" && (
            <div className="campo">
              <label htmlFor="inscricao">Inscrição / nº do casco</label>
              <input id="inscricao" name="inscricao" defaultValue={e?.inscricao ?? ""} />
            </div>
          )}
          <div className="campo campo-largo">
            <label htmlFor="equipamentos">Equipamentos e itens de série</label>
            <textarea id="equipamentos" name="equipamentos" rows={5} placeholder={"Um item por linha\nGerador 17,5 kW\nAr-condicionado em todas as cabines"} defaultValue={e?.equipamentos ?? ""} />
          </div>
          <div className="campo campo-largo">
            <label htmlFor="descricao">Texto de apresentação</label>
            <textarea id="descricao" name="descricao" placeholder="Aparece na proposta, logo abaixo do nome do modelo." defaultValue={e?.descricao ?? ""} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Fotos</legend>
        <div className="campo">
          <label htmlFor="fotos">Adicionar fotos (JPG, PNG ou WebP, até 6 MB cada)</label>
          <input id="fotos" name="fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <span className="ajuda">{condicao === "SEMINOVO" ? "Seminovo: foto nítida do casco inteiro, sem filtro." : "Novo: fotos que valorizam design e cenário."} A primeira foto vai para a capa da proposta.</span>
        </div>
      </fieldset>

      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="form-acoes">
        <BotaoEnviar>{e ? "Salvar alterações" : "Cadastrar embarcação"}</BotaoEnviar>
        <Link className="btn" href="/embarcacoes">Cancelar</Link>
      </div>
    </form>
  );
}
