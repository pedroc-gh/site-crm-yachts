import { db } from "@/lib/db";
import type { UsuarioLogado } from "@/lib/auth";
import { escopoVendedor } from "@/lib/auth";
import { num, reais } from "@/lib/formato";

export async function opcoesProposta(u: UsuarioLogado) {
  const [clientes, barcos] = await Promise.all([
    db.cliente.findMany({
      where: { ...escopoVendedor(u), etapa: { not: "PERDIDO" } },
      select: { id: true, nome: true, cidade: true },
      orderBy: { nome: "asc" },
    }),
    db.embarcacao.findMany({
      where: { status: { not: "VENDIDA" } },
      select: { id: true, modelo: true, ano: true, preco: true, condicao: true, status: true },
      orderBy: [{ condicao: "asc" }, { modelo: "asc" }],
    }),
  ]);
  return {
    clientes: clientes.map((c) => ({ id: c.id, rotulo: c.cidade ? `${c.nome} · ${c.cidade}` : c.nome })),
    barcos: barcos.map((b) => ({
      id: b.id,
      rotulo: `${b.modelo}${b.ano ? ` ${b.ano}` : ""} · ${reais(b.preco)}`,
      preco: num(b.preco),
      condicao: b.condicao,
      status: b.status,
    })),
  };
}
