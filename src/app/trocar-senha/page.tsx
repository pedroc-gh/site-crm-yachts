"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState } from "react";
import Link from "next/link";
import { trocarSenha } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export default function TrocarSenha() {
  const [erro, acao] = useActionState(trocarSenha, null);
  return (
    <main className="login">
      <section className="kv" aria-hidden="true">
        <h1 className="display">Confiança</h1>
        <p className="destaque">se constrói com história</p>
      </section>
      <section className="painel">
        <img className="logo" src="/brand/logo-turquesa.svg" alt="Regatta Yachts" />
        <div className="pilha" style={{ gap: 8 }}>
          <p className="eyebrow">Segurança</p>
          <h2 className="display display-md">Defina sua senha</h2>
          <p className="muted" style={{ margin: 0, maxWidth: 380 }}>
            Digite a senha provisória que você recebeu e escolha uma senha pessoal com 8 caracteres ou mais.
          </p>
        </div>
        <FormAcao acao={acao}>
          <div className="campo">
            <label htmlFor="atual">Senha atual ou provisória</label>
            <input id="atual" name="atual" type="password" autoComplete="current-password" required />
          </div>
          <div className="campo">
            <label htmlFor="nova">Nova senha</label>
            <input id="nova" name="nova" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="campo">
            <label htmlFor="confirma">Repita a nova senha</label>
            <input id="confirma" name="confirma" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <div className="linha-flex">
            <BotaoEnviar>Salvar senha</BotaoEnviar>
            <Link href="/" className="btn btn-texto">Voltar</Link>
          </div>
        </FormAcao>
      </section>
    </main>
  );
}
