"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState } from "react";
import Link from "next/link";
import type { Cliente } from "@prisma/client";
import { salvarCliente } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { ORIGENS, UFS } from "@/lib/rotulos";

type ClienteForm = Omit<Cliente, "orcamento"> & { orcamento: string | null };
const d = (v: Date | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export function FormCliente({
  cliente,
  vendedores,
  vendedorPadrao,
}: {
  cliente?: ClienteForm;
  vendedores?: { id: string; nome: string }[];
  vendedorPadrao?: string;
}) {
  const [erro, acao] = useActionState(salvarCliente, null);
  const c = cliente;
  return (
    <FormAcao acao={acao} className="form">
      {c && <input type="hidden" name="id" value={c.id} />}
      <p className="aviso-obrigatorios"><span aria-hidden="true">*</span> Campos obrigatórios. Telefone e e-mail: preencha pelo menos um dos dois.</p>

      <fieldset>
        <legend className="eyebrow">Contato</legend>
        <div className="campos">
          <div className="campo campo-largo">
            <label htmlFor="nome">Nome completo</label>
            <input id="nome" name="nome" defaultValue={c?.nome} required />
          </div>
          <div className="campo">
            <label htmlFor="telefone" className="um-dos">Celular / WhatsApp <span>ou e-mail</span></label>
            <input id="telefone" name="telefone" type="tel" placeholder="11 95799 7972" defaultValue={c?.telefone ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="email" className="um-dos">E-mail <span>ou celular</span></label>
            <input id="email" name="email" type="email" defaultValue={c?.email ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="cpfCnpj">CPF ou CNPJ</label>
            <input id="cpfCnpj" name="cpfCnpj" defaultValue={c?.cpfCnpj ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="dataNascimento">Data de nascimento</label>
            <input id="dataNascimento" name="dataNascimento" type="date" defaultValue={d(c?.dataNascimento)} />
          </div>
          <div className="campo">
            <label htmlFor="cidade">Cidade</label>
            <input id="cidade" name="cidade" defaultValue={c?.cidade ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="uf">UF</label>
            <select id="uf" name="uf" defaultValue={c?.uf ?? ""}>
              <option value="">—</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="profissao">Profissão / empresa</label>
            <input id="profissao" name="profissao" defaultValue={c?.profissao ?? ""} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Perfil de compra</legend>
        <div className="campos">
          <div className="campo">
            <label htmlFor="origem">Como chegou até nós</label>
            <select id="origem" name="origem" defaultValue={c?.origem ?? ""}>
              <option value="">—</option>
              {ORIGENS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="interesse">Interesse</label>
            <select id="interesse" name="interesse" defaultValue={c?.interesse ?? ""}>
              <option value="">Ainda não definido</option>
              <option value="NOVO">Barco novo</option>
              <option value="SEMINOVO">Barco seminovo</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="modeloInteresse">Modelo de interesse</label>
            <input id="modeloInteresse" name="modeloInteresse" placeholder="SESSA C68" defaultValue={c?.modeloInteresse ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="orcamento">Orçamento estimado (R$)</label>
            <input id="orcamento" name="orcamento" inputMode="decimal" placeholder="3.500.000,00" defaultValue={c?.orcamento ?? ""} />
          </div>
          <div className="campo campo-largo">
            <label htmlFor="possuiBarco">Barco atual (possível troca)</label>
            <input id="possuiBarco" name="possuiBarco" placeholder="Phantom 345, 2019, 450 h" defaultValue={c?.possuiBarco ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="proximoContato">Próximo contato</label>
            <input id="proximoContato" name="proximoContato" type="date" defaultValue={d(c?.proximoContato)} />
          </div>
          {vendedores && (
            <div className="campo">
              <label htmlFor="vendedorId">Consultor responsável</label>
              <select id="vendedorId" name="vendedorId" defaultValue={c?.vendedorId ?? vendedorPadrao}>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
          )}
          <div className="campo campo-largo">
            <label htmlFor="observacoes">Observações</label>
            <textarea id="observacoes" name="observacoes" placeholder="Família, uso pretendido, marina, preferências..." defaultValue={c?.observacoes ?? ""} />
          </div>
        </div>
      </fieldset>

      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="form-acoes">
        <BotaoEnviar>{c ? "Salvar alterações" : "Cadastrar cliente"}</BotaoEnviar>
        <Link className="btn" href={c ? `/clientes/${c.id}` : "/clientes"}>Cancelar</Link>
      </div>
    </FormAcao>
  );
}
