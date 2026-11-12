"use client";
export function BotaoImprimir() {
  return (
    <button type="button" className="btn btn-escuro" onClick={() => window.print()}>
      Baixar PDF / imprimir
    </button>
  );
}
