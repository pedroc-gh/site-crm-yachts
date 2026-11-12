import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { FormLogin } from "./FormLogin";

export const metadata = { title: "Entrar" };

export default async function Login() {
  if (await usuarioAtual()) redirect("/");
  return (
    <main className="login">
      <section className="kv" aria-hidden="true">
        <h1 className="display">Navegue<br />a sua<br />história</h1>
        <p className="destaque">Portal do consultor</p>
      </section>
      <section className="painel">
        <img className="logo" src="/brand/logo-turquesa.svg" alt="Regatta Yachts" />
        <div className="pilha" style={{ gap: 8 }}>
          <p className="eyebrow">Acesso restrito</p>
          <h2 className="display display-md">Entrar no CRM</h2>
          <p className="muted" style={{ margin: 0, maxWidth: 380 }}>
            Use o e-mail cadastrado pelo administrador. No primeiro acesso você define a sua senha.
          </p>
        </div>
        <FormLogin />
      </section>
    </main>
  );
}
