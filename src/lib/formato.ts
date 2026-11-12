type Num = number | string | { toString(): string } | null | undefined;

export const num = (v: Num) => (v == null || v === "" ? 0 : Number(v.toString()));

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** R$ 399.000,00 — preço sempre completo, como pede o brand book. */
export const reais = (v: Num) => brl.format(num(v)).replace(/ /g, " ");

export const data = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

export const dataHora = (d: Date | string) =>
  new Date(d).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Valor de <input type="date"> a partir de uma data. */
export const paraInputData = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** Telefone em grupos: 11 95799 7972 */
export function telefone(t: string | null | undefined) {
  if (!t) return "—";
  const d = t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  return t;
}

export const linkWhatsapp = (t: string | null | undefined) => {
  const d = (t ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? "55" + d : d}`;
};

/** Converte "1.250.000,50" ou "1250000.50" em número. */
export function lerValor(v: FormDataEntryValue | null): number {
  if (v == null) return 0;
  let s = String(v).trim().replace(/[R$\s]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export const numeroProposta = (n: number, d: Date) => `RY-${new Date(d).getFullYear()}-${String(n).padStart(4, "0")}`;

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Opcionais: um por linha, "Descrição | 85.000,00". Linhas sem valor entram como item incluso. */
export function lerOpcionais(texto: string | null | undefined) {
  return (texto ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf("|");
      if (i < 0) return { item: l, valor: 0 };
      return { item: l.slice(0, i).trim(), valor: lerValor(l.slice(i + 1)) };
    });
}

export function calcularProposta(v: {
  valorTabela: number;
  opcionais: string | null;
  desconto: number;
  valorTroca: number;
  entrada: number;
  parcelas: number;
}) {
  const valorOpcionais = lerOpcionais(v.opcionais).reduce((s, o) => s + o.valor, 0);
  const valorFinal = Math.max(0, v.valorTabela + valorOpcionais - v.desconto - v.valorTroca);
  const saldo = Math.max(0, valorFinal - v.entrada);
  const valorParcela = v.parcelas > 0 ? Math.round((saldo / v.parcelas) * 100) / 100 : 0;
  return { valorOpcionais, valorFinal, saldo, valorParcela };
}
