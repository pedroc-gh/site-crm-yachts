"use client";
import { FormAcao } from "@/components/FormAcao";
import { useActionState, useRef } from "react";
import { registrarInteracao } from "../actions";
import { TIPOS_INTERACAO } from "@/lib/rotulos";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function NovaInteracao({ clienteId }: { clienteId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [erro, acao] = useActionState(async (prev: string | null, f: FormData) => {
    const r = await registrarInteracao(prev, f);
    if (!r) ref.current?.reset();
    return r;
  }, null);
  return (
    <FormAcao ref={ref} acao={acao} className="nova-interacao">
      <input type="hidden" name="clienteId" value={clienteId} />
      <div className="linha">
        <div className="campo">
          <label htmlFor="tipo">Tipo de contato</label>
          <select id="tipo" name="tipo" defaultValue="WHATSAPP">
            {TIPOS_INTERACAO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="descricao">O que foi conversado</label>
          <textarea id="descricao" name="descricao" rows={2} style={{ minHeight: 42 }} required placeholder="Ex.: enviou fotos do Phantom 345, quer navegar no sábado" />
        </div>
      </div>
      <div className="linha-flex entre">
        <div className="linha-flex">
          <label className="label" htmlFor="proximoContatoInt">Próximo contato</label>
          <input id="proximoContatoInt" name="proximoContato" type="date" style={{ width: "auto" }} />
        </div>
        <BotaoEnviar className="btn btn-escuro btn-sm" pendente="Registrando…">Registrar contato</BotaoEnviar>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </FormAcao>
  );
}
