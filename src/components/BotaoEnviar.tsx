"use client";
import { useFormStatus } from "react-dom";

export function BotaoEnviar({
  children,
  pendente = "Salvando…",
  className = "btn btn-cta",
}: {
  children: React.ReactNode;
  pendente?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendente : children}
    </button>
  );
}
