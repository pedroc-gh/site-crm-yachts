"use client";
import { useActionState, useState } from "react";
import { criarUsuario, redefinirSenha, type ResultadoUsuario } from "./actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

function SenhaGerada({ r }: { r: NonNullable<ResultadoUsuario> }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Olá, ${r.nome?.split(" ")[0]}! Seu acesso ao CRM Regatta Yachts:\nE-mail: ${r.email}\nSenha provisória: ${r.senha}\nNo primeiro acesso você vai definir a sua senha.`;
  return (
    <div className="aviso aviso-ok" role="status" style={{ display: "grid", gap: 8 }}>
      <strong>Acesso pronto para {r.nome}</strong>
      <span>E-mail: {r.email}</span>
      <span>Senha provisória: <code style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.08em" }}>{r.senha}</code></span>
      <span className="muted" style={{ fontSize: 13 }}>Ela aparece só agora. Envie ao consultor; no primeiro acesso ele cria a senha pessoal.</span>
      <div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => navigator.clipboard.writeText(texto).then(() => setCopiado(true), () => setCopiado(false))}
        >
          {copiado ? "Mensagem copiada" : "Copiar mensagem para enviar"}
        </button>
      </div>
    </div>
  );
}

export function FormNovoUsuario() {
  const [r, acao] = useActionState(criarUsuario, null);
  return (
    <form action={acao} className="form" style={{ gap: 16 }}>
      <div className="campos">
        <div className="campo"><label htmlFor="nome">Nome *</label><input id="nome" name="nome" required /></div>
        <div className="campo"><label htmlFor="email">E-mail de acesso *</label><input id="email" name="email" type="email" required /></div>
        <div className="campo"><label htmlFor="telefone">Celular</label><input id="telefone" name="telefone" type="tel" placeholder="Sai na proposta" /></div>
        <div className="campo">
          <label htmlFor="papel">Perfil</label>
          <select id="papel" name="papel" defaultValue="VENDEDOR">
            <option value="VENDEDOR">Consultor (vê a própria carteira)</option>
            <option value="ADMIN">Administrador (vê tudo e gerencia a equipe)</option>
          </select>
        </div>
      </div>
      {r?.erro && <p className="erro" role="alert">{r.erro}</p>}
      {r?.senha && <SenhaGerada r={r} />}
      <div><BotaoEnviar pendente="Criando…">Criar acesso</BotaoEnviar></div>
    </form>
  );
}

export function FormRedefinirSenha({ id }: { id: string }) {
  const [r, acao] = useActionState(redefinirSenha, null);
  return (
    <form action={acao} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <BotaoEnviar className="btn btn-sm" pendente="Gerando…">Nova senha provisória</BotaoEnviar>
      {r?.senha && <SenhaGerada r={r} />}
    </form>
  );
}
