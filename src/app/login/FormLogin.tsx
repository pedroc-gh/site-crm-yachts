"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState } from "react";
import { entrar } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function FormLogin() {
  const [erro, acao] = useActionState(entrar, null);
  return (
    <FormAcao acao={acao}>
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <BotaoEnviar pendente="Entrando…">Entrar</BotaoEnviar>
    </FormAcao>
  );
}
