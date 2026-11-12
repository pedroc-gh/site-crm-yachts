import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormCliente } from "../FormCliente";

export const metadata = { title: "Novo cliente" };

export default async function NovoCliente() {
  const u = await exigirUsuario();
  const vendedores =
    u.papel === "ADMIN"
      ? await db.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : undefined;
  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Clientes</p>
          <h1 className="display display-lg">Novo cliente</h1>
        </div>
      </header>
      <FormCliente vendedores={vendedores} vendedorPadrao={u.id} />
    </>
  );
}
