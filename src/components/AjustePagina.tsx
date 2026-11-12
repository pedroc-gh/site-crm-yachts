"use client";
import { useLayoutEffect, useRef } from "react";

/**
 * Garante que a proposta caiba em uma folha: se o corpo transbordar,
 * reduz a escala do texto (--e) em passos de 4%, até 72%.
 */
export function AjustePagina() {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const folha = ref.current?.closest<HTMLElement>(".folha");
    const corpo = folha?.querySelector<HTMLElement>("[data-ajuste]");
    if (!folha || !corpo) return;
    const ajustar = () => {
      let e = 1;
      folha.style.setProperty("--e", "1");
      while (corpo.scrollHeight > corpo.clientHeight + 1 && e > 0.72) {
        e = Math.round((e - 0.04) * 100) / 100;
        folha.style.setProperty("--e", String(e));
      }
      folha.dataset.cabe = corpo.scrollHeight > corpo.clientHeight + 1 ? "nao" : "sim";
      folha.dataset.escala = String(e);
      const aviso = document.getElementById("aviso-transbordo");
      if (aviso) aviso.hidden = folha.dataset.cabe === "sim";
    };
    ajustar();
    document.fonts?.ready.then(ajustar);
    const imgs = Array.from(folha.querySelectorAll("img"));
    imgs.forEach((i) => i.addEventListener("load", ajustar));
    return () => imgs.forEach((i) => i.removeEventListener("load", ajustar));
  }, []);
  return <span ref={ref} hidden />;
}
