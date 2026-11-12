"use client";
import { useContext } from "react";
import { useFormStatus } from "react-dom";
import { PendenteCtx } from "./FormAcao";

export function BotaoEnviar({
  children,
  pendente = "Salvando…",
  className = "btn btn-cta",
}: {
  children: React.ReactNode;
  pendente?: string;
  className?: string;
}) {
  const { pending: status } = useFormStatus();
  const pendenteAcao = useContext(PendenteCtx);
  const pending = status || pendenteAcao;
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendente : children}
    </button>
  );
}
