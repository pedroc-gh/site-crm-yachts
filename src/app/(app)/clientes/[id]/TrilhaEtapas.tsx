"use client";
import { useState, useTransition } from "react";
import type { Etapa } from "@prisma/client";
import { ETAPAS } from "@/lib/rotulos";
import { moverEtapa } from "../actions";

export function TrilhaEtapas({ clienteId, etapa }: { clienteId: string; etapa: Etapa }) {
  const [pendente, iniciar] = useTransition();
  const [perguntarMotivo, setPerguntarMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const idxAtual = ETAPAS.findIndex((e) => e.valor === etapa);

  function escolher(nova: Etapa) {
    if (nova === etapa) return;
    if (nova === "PERDIDO") return setPerguntarMotivo(true);
    iniciar(() => void moverEtapa(clienteId, nova));
  }

  return (
    <div>
      <div className="etapas-trilha" role="group" aria-label="Etapa do atendimento" aria-busy={pendente}>
        {ETAPAS.map((e, i) => {
          const atual = e.valor === etapa;
          const feita = etapa !== "PERDIDO" && i < idxAtual && e.valor !== "PERDIDO";
          return (
            <button
              key={e.valor}
              type="button"
              title={e.descricao}
              className={[atual && "atual", feita && "feita", atual && e.valor === "GANHO" && "ganho"].filter(Boolean).join(" ")}
              aria-pressed={atual}
              disabled={pendente}
              onClick={() => escolher(e.valor)}
            >
              {e.rotulo}
            </button>
          );
        })}
      </div>
      {perguntarMotivo && (
        <div className="nova-interacao" style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="motivo">Por que o cliente não seguiu?</label>
          <input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Preço, comprou de outro, adiou a compra..." />
          <div className="linha-flex">
            <button
              type="button"
              className="btn btn-escuro btn-sm"
              disabled={pendente}
              onClick={() => iniciar(async () => { await moverEtapa(clienteId, "PERDIDO", motivo); setPerguntarMotivo(false); })}
            >
              Marcar como perdido
            </button>
            <button type="button" className="btn btn-texto btn-sm" onClick={() => setPerguntarMotivo(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
