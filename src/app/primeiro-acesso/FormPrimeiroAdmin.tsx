"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState } from "react";
import { criarPrimeiroAdmin } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function FormPrimeiroAdmin() {
  const [erro, acao] = useActionState(criarPrimeiroAdmin, null);
  return (
    <FormAcao acao={acao}>
      <div className="campo">
        <label htmlFor="nome">Seu nome</label>
        <input id="nome" name="nome" autoComplete="name" required autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="campo">
        <label htmlFor="confirma">Repita a senha</label>
        <input id="confirma" name="confirma" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <BotaoEnviar pendente="Criando…">Criar administrador</BotaoEnviar>
    </FormAcao>
  );
}
