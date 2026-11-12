import { exigirUsuario } from "@/lib/auth";
import { FormEmbarcacao } from "../FormEmbarcacao";

export const metadata = { title: "Nova embarcação" };

export default async function NovaEmbarcacao({ searchParams }: { searchParams: Promise<{ condicao?: string }> }) {
  await exigirUsuario();
  const { condicao } = await searchParams;
  const c = condicao === "SEMINOVO" ? "SEMINOVO" : "NOVO";
  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Embarcações</p>
          <h1 className="display display-lg">{c === "NOVO" ? "Novo modelo" : "Novo seminovo"}</h1>
        </div>
      </header>
      <FormEmbarcacao condicaoInicial={c} />
    </>
  );
}
