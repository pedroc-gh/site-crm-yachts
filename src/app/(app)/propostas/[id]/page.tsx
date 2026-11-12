import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { numeroProposta } from "@/lib/formato";
import { rotuloStatusProposta } from "@/lib/rotulos";
import { TagStatusProposta } from "@/components/Tags";
import { DocumentoProposta } from "@/components/DocumentoProposta";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { duplicarProposta, mudarStatusProposta } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await db.proposta.findUnique({ where: { id: (await params).id }, select: { numero: true, criadoEm: true } });
  return { title: p ? `Proposta ${numeroProposta(p.numero, p.criadoEm)}` : "Proposta" };
}

export default async function VerProposta({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirUsuario();
  const p = await db.proposta.findUnique({
    where: { id: (await params).id },
    include: {
      cliente: true,
      embarcacao: { include: { fotos: { select: { id: true }, orderBy: { ordem: "asc" }, take: 1 } } },
      vendedor: { select: { nome: true, email: true, telefone: true } },
    },
  });
  if (!p || (u.papel !== "ADMIN" && p.vendedorId !== u.id)) notFound();

  return (
    <>
      <div className="barra-proposta nao-imprimir">
        <div className="pilha" style={{ gap: 6 }}>
          <p className="eyebrow">Proposta {numeroProposta(p.numero, p.criadoEm)}</p>
          <div className="linha-flex">
            <TagStatusProposta status={p.status} />
            <Link href={`/clientes/${p.clienteId}`} style={{ fontSize: 14 }}>{p.cliente.nome}</Link>
          </div>
        </div>
        <div className="linha-flex">
          <form action={mudarStatusProposta} className="linha-flex">
            <input type="hidden" name="id" value={p.id} />
            <label className="label" htmlFor="status">Situação</label>
            <select id="status" name="status" defaultValue={p.status} style={{ width: "auto" }}>
              {Object.entries(rotuloStatusProposta).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
            <button className="btn btn-sm">Atualizar</button>
          </form>
          <Link className="btn" href={`/propostas/${p.id}/editar`}>Editar</Link>
          <form action={duplicarProposta}>
            <input type="hidden" name="id" value={p.id} />
            <button className="btn">Duplicar</button>
          </form>
          <BotaoImprimir />
        </div>
      </div>
      <DocumentoProposta p={p} />
    </>
  );
}
