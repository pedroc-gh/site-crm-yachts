import { exigirUsuario } from "@/lib/auth";
import { Navegacao } from "@/components/Navegacao";
import { sair } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  const itens = [
    { href: "/", rotulo: "Painel" },
    { grupo: "Atendimento" },
    { href: "/funil", rotulo: "Funil" },
    { href: "/clientes", rotulo: "Clientes" },
    { href: "/propostas", rotulo: "Propostas" },
    { grupo: "Estoque" },
    { href: "/embarcacoes", rotulo: "Embarcações" },
    ...(u.papel === "ADMIN" ? [{ grupo: "Administração" }, { href: "/usuarios", rotulo: "Equipe" }] : []),
  ];
  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <img src="/brand/logo-branco.svg" alt="Regatta Yachts" />
          <span>CRM COMERCIAL</span>
        </div>
        <Navegacao itens={itens} />
        <div className="usuario">
          <strong>{u.nome}</strong>
          <small>{u.papel === "ADMIN" ? "Administrador" : "Consultor"}</small>
          <div className="acoes">
            <a href="/trocar-senha">Trocar senha</a>
            <form action={sair}>
              <button type="submit">Sair</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}
