import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { numeroProposta } from "@/lib/formato";
import { rotuloStatusProposta, MAX_DETALHES } from "@/lib/rotulos";
import { TagStatusProposta } from "@/components/Tags";
import { DocumentoProposta } from "@/components/DocumentoProposta";
import { garantirDimensoes } from "@/lib/fotos";
import { ehVertical, foraDoPadrao } from "@/lib/proporcao";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { duplicarProposta, mudarStatusProposta } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await db.proposta.findUnique({ where: { id: (await params).id }, select: { numero: true, criadoEm: true } });
  return { title: p ? `Proposta ${numeroProposta(p.numero, p.criadoEm)}` : "Proposta" };
}

export default async function VerProposta({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirUsuario();
  const { id } = await params;
  const ref = await db.proposta.findUnique({ where: { id }, select: { embarcacaoId: true } });
  if (ref) await garantirDimensoes(ref.embarcacaoId);
  const p = await db.proposta.findUnique({
    where: { id },
    include: {
      cliente: true,
      embarcacao: { include: { fotos: { select: { id: true, papel: true, largura: true, altura: true }, orderBy: [{ papel: "asc" }, { ordem: "asc" }] } } },
      vendedor: { select: { nome: true, email: true, telefone: true } },
    },
  });
  if (!p || (u.papel !== "ADMIN" && p.vendedorId !== u.id)) notFound();
  const qtdDetalhes = p.embarcacao.fotos.filter((f) => f.papel === "DETALHE").length;
  const principalFoto = p.embarcacao.fotos.find((f) => f.papel === "PRINCIPAL");
  const fora = [
    principalFoto && (ehVertical(principalFoto) || foraDoPadrao(principalFoto)) && "a foto do costado não está em 4:3 horizontal",
    p.embarcacao.fotos.some((f) => f.papel === "DETALHE" && foraDoPadrao(f)) && "alguma foto de detalhe não está em 4:3 ou 3:4",
  ].filter(Boolean) as string[];
  const faltam = [
    !p.embarcacao.fotos.some((f) => f.papel === "PRINCIPAL") && "a foto principal (costado)",
    qtdDetalhes < MAX_DETALHES && `${MAX_DETALHES - qtdDetalhes} foto(s) de detalhe`,
  ].filter(Boolean) as string[];

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
      {faltam.length > 0 && (
        <div className="aviso aviso-fotos nao-imprimir" role="status">
          <span>Faltam fotos desta embarcação na proposta: {faltam.join(" e ")}.</span>
          <Link className="btn btn-sm" href={`/embarcacoes/${p.embarcacaoId}`}>Enviar fotos</Link>
        </div>
      )}
      {fora.length > 0 && (
        <div className="aviso aviso-fotos nao-imprimir" role="status">
          <span>Na proposta, {fora.join(" e ")}; a imagem será recortada para caber.</span>
          <Link className="btn btn-sm" href={`/embarcacoes/${p.embarcacaoId}`}>Ver fotos</Link>
        </div>
      )}
      <p id="aviso-transbordo" className="aviso aviso-transbordo nao-imprimir" role="alert" hidden>
        O conteúdo não coube inteiro na folha A4. Encurte os itens e equipamentos, os opcionais ou as observações.
      </p>
      <DocumentoProposta p={p} />
    </>
  );
}
