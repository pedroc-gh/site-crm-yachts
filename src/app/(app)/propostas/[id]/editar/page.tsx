import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { numeroProposta } from "@/lib/formato";
import { FormProposta } from "../../FormProposta";
import { opcoesProposta } from "../../dadosForm";

export const metadata = { title: "Editar proposta" };

const br = (v: { toString(): string }) => {
  const n = Number(v.toString());
  return n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
};

export default async function EditarProposta({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirUsuario();
  const p = await db.proposta.findUnique({ where: { id: (await params).id } });
  if (!p || (u.papel !== "ADMIN" && p.vendedorId !== u.id)) notFound();
  const { clientes, barcos } = await opcoesProposta(u);
  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Editar proposta</p>
          <h1 className="display display-lg">{numeroProposta(p.numero, p.criadoEm)}</h1>
        </div>
      </header>
      <FormProposta
        clientes={clientes}
        barcos={barcos}
        inicial={{
          id: p.id,
          clienteId: p.clienteId,
          embarcacaoId: p.embarcacaoId,
          valorTabela: br(p.valorTabela),
          opcionais: p.opcionais ?? "",
          desconto: br(p.desconto),
          barcoTroca: p.barcoTroca ?? "",
          valorTroca: br(p.valorTroca),
          entrada: br(p.entrada),
          parcelas: String(p.parcelas),
          formaPagamento: p.formaPagamento ?? "",
          prazoEntrega: p.prazoEntrega ?? "",
          localEntrega: p.localEntrega ?? "",
          validade: p.validade.toISOString().slice(0, 10),
          observacoes: p.observacoes ?? "",
        }}
      />
    </>
  );
}
