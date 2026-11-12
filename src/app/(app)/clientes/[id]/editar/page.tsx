import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { clienteDoUsuario } from "../../actions";
import { FormCliente } from "../../FormCliente";

export const metadata = { title: "Editar cliente" };

export default async function EditarCliente({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirUsuario();
  const c = await clienteDoUsuario((await params).id, u);
  if (!c) notFound();
  const vendedores =
    u.papel === "ADMIN"
      ? await db.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : undefined;
  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Editar cliente</p>
          <h1 className="display display-lg">{c.nome}</h1>
        </div>
      </header>
      <FormCliente cliente={{ ...c, orcamento: c.orcamento ? c.orcamento.toString().replace(".", ",") : null }} vendedores={vendedores} />
    </>
  );
}
