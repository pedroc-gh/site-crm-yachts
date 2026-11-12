"use client";
import { createContext, useTransition } from "react";

export const PendenteCtx = createContext(false);

/**
 * Formulário que envia para uma server action SEM limpar os campos.
 * (O <form action> do React 19 reinicia o formulário após cada envio,
 * o que apagava o que o vendedor digitou quando havia erro de validação.)
 */
export function FormAcao({
  acao,
  children,
  ...props
}: { acao: (dados: FormData) => void } & Omit<React.ComponentProps<"form">, "action" | "onSubmit">) {
  const [pendente, iniciar] = useTransition();
  return (
    <PendenteCtx.Provider value={pendente}>
      <form
        {...props}
        aria-busy={pendente}
        onSubmit={(e) => {
          e.preventDefault();
          if (pendente) return;
          const dados = new FormData(e.currentTarget);
          iniciar(() => acao(dados));
        }}
      >
        {children}
      </form>
    </PendenteCtx.Provider>
  );
}
