import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { num } from "@/lib/formato";
import { FormProposta } from "../FormProposta";
import { opcoesProposta } from "../dadosForm";

export const metadata = { title: "Nova proposta" };

export default async function NovaProposta({ searchParams }: { searchParams: Promise<{ cliente?: string; embarcacao?: string }> }) {
  const u = await exigirUsuario();
  const { cliente = "", embarcacao = "" } = await searchParams;
  const { clientes, barcos } = await opcoesProposta(u);
  const b = embarcacao ? await db.embarcacao.findUnique({ where: { id: embarcacao } }) : null;
  const validade = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Propostas</p>
          <h1 className="display display-lg">Nova proposta</h1>
        </div>
      </header>
      <FormProposta
        clientes={clientes}
        barcos={barcos}
        inicial={{
          clienteId: clientes.some((c) => c.id === cliente) ? cliente : "",
          embarcacaoId: b ? b.id : "",
          valorTabela: b ? num(b.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "",
          opcionais: "",
          desconto: "",
          barcoTroca: "",
          valorTroca: "",
          entrada: "",
          parcelas: "0",
          formaPagamento: "",
          prazoEntrega: b?.condicao === "SEMINOVO" ? "Imediata, após quitação" : "",
          localEntrega: b?.localizacao ?? "",
          validade,
          observacoes: "",
        }}
      />
    </>
  );
}
