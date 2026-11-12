import { usuarioAtual } from "@/lib/auth";
import { gerarModelo } from "@/lib/importacao/planilha";

export async function GET(_: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const u = await usuarioAtual();
  if (!u || u.papel !== "ADMIN") return new Response("Não autorizado", { status: 401 });
  const { tipo } = await params;
  if (tipo !== "clientes" && tipo !== "embarcacoes") return new Response("Modelo inexistente", { status: 404 });
  const buf = await gerarModelo(tipo);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="modelo-${tipo === "clientes" ? "clientes" : "embarcacoes"}-regatta-yachts.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
