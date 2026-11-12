"use client";
import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import type { Etapa } from "@prisma/client";
import { ETAPAS } from "@/lib/rotulos";
import { moverEtapa } from "../clientes/actions";

export type CartaoCliente = {
  id: string;
  nome: string;
  etapa: Etapa;
  modelo: string | null;
  orcamento: number | null;
  proximoContato: string | null;
  atrasado: boolean;
  vendedor: string | null;
};

const brl = (n: number) =>
  n >= 1_000_000 ? `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi` : `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;

export function Kanban({ cartoes, mostrarPerdidos }: { cartoes: CartaoCliente[]; mostrarPerdidos: boolean }) {
  const [lista, mover] = useOptimistic(cartoes, (estado, { id, etapa }: { id: string; etapa: Etapa }) =>
    estado.map((c) => (c.id === id ? { ...c, etapa } : c)),
  );
  const [, iniciar] = useTransition();
  const [alvo, setAlvo] = useState<Etapa | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const colunas = ETAPAS.filter((e) => mostrarPerdidos || e.valor !== "PERDIDO");

  function soltar(etapa: Etapa, id: string) {
    setAlvo(null);
    const c = lista.find((x) => x.id === id);
    if (!c || c.etapa === etapa) return;
    iniciar(async () => {
      mover({ id, etapa });
      await moverEtapa(id, etapa, etapa === "PERDIDO" ? "Marcado como perdido pelo funil" : undefined);
    });
  }

  return (
    <div className="kanban">
      {colunas.map((col) => {
        const itens = lista.filter((c) => c.etapa === col.valor);
        const soma = itens.reduce((s, c) => s + (c.orcamento ?? 0), 0);
        return (
          <section
            key={col.valor}
            className={`coluna${alvo === col.valor ? " alvo" : ""}`}
            data-etapa={col.valor}
            onDragOver={(e) => { e.preventDefault(); setAlvo(col.valor); }}
            onDragLeave={() => setAlvo((a) => (a === col.valor ? null : a))}
            onDrop={(e) => { e.preventDefault(); soltar(col.valor, e.dataTransfer.getData("text/plain")); }}
            aria-label={col.rotulo}
          >
            <header>
              <h2>{col.rotulo}</h2>
              <span className="total">{itens.length}{soma > 0 ? ` · ${brl(soma)}` : ""}</span>
            </header>
            <div className="cartoes">
              {itens.map((c) => (
                <article
                  key={c.id}
                  className={`cartao${arrastando === c.id ? " arrastando" : ""}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.id); setArrastando(c.id); }}
                  onDragEnd={() => setArrastando(null)}
                >
                  <Link href={`/clientes/${c.id}`}>{c.nome}</Link>
                  <span>{c.modelo ?? "Modelo a definir"}</span>
                  <div className="meta">
                    <span>{c.orcamento ? brl(c.orcamento) : "—"}</span>
                    {c.proximoContato && <span className={c.atrasado ? "atrasado" : undefined}>{c.proximoContato}</span>}
                  </div>
                  {c.vendedor && <div className="meta"><span>{c.vendedor}</span></div>}
                  <label className="sr-mover">
                    <span className="label" style={{ fontSize: 9 }}>Mover para</span>
                    <select
                      value={c.etapa}
                      onChange={(e) => soltar(e.target.value as Etapa, c.id)}
                      style={{ minHeight: 30, padding: "2px 6px", fontSize: 12 }}
                    >
                      {ETAPAS.map((e) => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
