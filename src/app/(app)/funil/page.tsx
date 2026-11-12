import Link from "next/link";
import { db } from "@/lib/db";
import { escopoVendedor, exigirUsuario } from "@/lib/auth";
import { num } from "@/lib/formato";
import { Kanban, type CartaoCliente } from "./Kanban";

export const metadata = { title: "Funil" };

export default async function Funil({ searchParams }: { searchParams: Promise<{ perdidos?: string; vendedor?: string }> }) {
  const u = await exigirUsuario();
  const { perdidos, vendedor } = await searchParams;
  const clientes = await db.cliente.findMany({
    where: { ...escopoVendedor(u), ...(vendedor && u.papel === "ADMIN" ? { vendedorId: vendedor } : {}) },
    include: { vendedor: { select: { nome: true } } },
    orderBy: [{ proximoContato: { sort: "asc", nulls: "last" } }, { atualizadoEm: "desc" }],
  });
  const vendedores = u.papel === "ADMIN" ? await db.usuario.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }) : [];
  const hoje = new Date(new Date().toDateString());
  const cartoes: CartaoCliente[] = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    etapa: c.etapa,
    modelo: c.modeloInteresse,
    orcamento: c.orcamento ? num(c.orcamento) : null,
    proximoContato: c.proximoContato ? c.proximoContato.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : null,
    atrasado: !!c.proximoContato && c.proximoContato < hoje,
    vendedor: u.papel === "ADMIN" ? c.vendedor.nome : null,
  }));

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Arraste o cartão para mudar a etapa</p>
          <h1 className="display display-lg">Funil de vendas</h1>
        </div>
        <div className="acoes">
          <Link className="btn" href={perdidos ? "/funil" : "/funil?perdidos=1"}>{perdidos ? "Ocultar perdidos" : "Mostrar perdidos"}</Link>
          <Link href="/clientes/novo" className="btn btn-cta">Novo cliente</Link>
        </div>
      </header>
      {u.papel === "ADMIN" && (
        <form className="filtros">
          {perdidos && <input type="hidden" name="perdidos" value="1" />}
          <select name="vendedor" defaultValue={vendedor ?? ""} aria-label="Consultor">
            <option value="">Todos os consultores</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
          <button className="btn btn-sm">Filtrar</button>
        </form>
      )}
      <Kanban cartoes={cartoes} mostrarPerdidos={!!perdidos} />
    </>
  );
}
