import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response("Não autorizado", { status: 401 });
  const { id } = await params;
  const foto = await db.foto.findUnique({ where: { id }, select: { mime: true, dados: true } });
  if (!foto) return new Response("Não encontrada", { status: 404 });
  return new Response(Buffer.from(foto.dados), {
    headers: { "Content-Type": foto.mime, "Cache-Control": "private, max-age=86400, immutable" },
  });
}
