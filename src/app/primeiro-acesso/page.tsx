import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FormPrimeiroAdmin } from "./FormPrimeiroAdmin";

export const metadata = { title: "Primeiro acesso" };
export const dynamic = "force-dynamic";

export default async function PrimeiroAcesso() {
  if ((await db.usuario.count()) > 0) redirect("/login");
  return (
    <main className="login">
      <section className="kv" aria-hidden="true">
        <h1 className="display">Bem-<br />vindo<br />a bordo</h1>
        <p className="destaque">Configuração inicial</p>
      </section>
      <section className="painel">
        <img className="logo" src="/brand/logo-turquesa.svg" alt="Regatta Yachts" />
        <div className="pilha" style={{ gap: 8 }}>
          <p className="eyebrow">Primeiro acesso</p>
          <h2 className="display display-md">Criar administrador</h2>
          <p className="muted" style={{ margin: 0, maxWidth: 380 }}>
            O sistema ainda não tem usuários. Crie a conta de administrador; depois cadastre os vendedores em Equipe.
            Esta tela some assim que o administrador é criado.
          </p>
        </div>
        <FormPrimeiroAdmin />
      </section>
    </main>
  );
}
