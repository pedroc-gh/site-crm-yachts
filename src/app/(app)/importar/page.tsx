import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { Importador } from "./Importador";

export const metadata = { title: "Importar planilha" };

export default async function Importar({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await exigirAdmin();
  const { tipo: t } = await searchParams;
  const tipo = t === "embarcacoes" ? "embarcacoes" : "clientes";
  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Administração</p>
          <h1 className="display display-lg">Importar planilha</h1>
        </div>
      </header>
      <nav className="abas" aria-label="O que importar">
        <Link href="/importar?tipo=clientes" aria-current={tipo === "clientes" ? "page" : undefined}>Clientes</Link>
        <Link href="/importar?tipo=embarcacoes" aria-current={tipo === "embarcacoes" ? "page" : undefined}>Embarcações</Link>
      </nav>
      <Importador key={tipo} tipo={tipo} />
    </>
  );
}
