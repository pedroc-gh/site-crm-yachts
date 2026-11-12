import "server-only";
import ExcelJS from "exceljs";
import { colunasDe, normalizar, type Coluna, type TipoImportacao } from "./colunas";

export const MAX_LINHAS = 2000;
export type Valor = string | number | Date | null;
export type LinhaLida = { numero: number; valores: Record<string, Valor> };
export type Leitura = { linhas: LinhaLida[]; ignoradas: string[]; faltando: string[] };

const AZUL = "FF142234";
const GELO = "FFD8E1E5";
const NOME_ABA: Record<TipoImportacao, string> = { clientes: "Clientes", embarcacoes: "Embarcações" };
const tituloComMarca = (c: Coluna) => (c.obrigatorio ? `${c.titulo} *` : c.titulo);

/** Modelo .xlsx: aba de dados só com cabeçalho e menus suspensos, e aba de instruções com exemplos. */
export async function gerarModelo(tipo: TipoImportacao): Promise<Buffer> {
  const colunas = colunasDe(tipo);
  const wb = new ExcelJS.Workbook();
  wb.creator = "CRM Regatta Yachts";

  const ws = wb.addWorksheet(NOME_ABA[tipo], { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = colunas.map((c) => ({ header: tituloComMarca(c), key: c.chave, width: c.largura ?? 16 }));
  const cab = ws.getRow(1);
  cab.height = 30;
  cab.eachCell((cell, i) => {
    const c = colunas[i - 1];
    cell.font = { bold: true, color: { argb: c.obrigatorio ? "FFBEA882" : "FFFFFFFF" }, name: "Arial", size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.note = [c.obrigatorio ? "OBRIGATÓRIO." : "", c.ajuda, c.exemplo !== "" ? `Exemplo: ${c.exemplo}` : ""].filter(Boolean).join(" ");
  });
  colunas.forEach((c, i) => {
    const letra = ws.getColumn(i + 1).letter;
    if (c.opcoes) {
      const lista = `"${c.opcoes.join(",")}"`;
      // O Excel limita listas digitadas a 255 caracteres; acima disso o menu fica de fora, mas o valor ainda é validado na importação
      if (lista.length <= 255) {
        for (let r = 2; r <= MAX_LINHAS + 1; r++) {
          ws.getCell(`${letra}${r}`).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [lista],
            showErrorMessage: c.chave !== "origem",
            errorTitle: c.titulo,
            error: `Escolha um valor da lista: ${c.opcoes.join(", ")}`,
          };
        }
      }
    }
    if (["dataNascimento", "proximoContato"].includes(c.chave)) ws.getColumn(i + 1).numFmt = "dd/mm/yyyy";
    if (["orcamento", "preco"].includes(c.chave)) ws.getColumn(i + 1).numFmt = '#,##0.00';
  });

  const inst = wb.addWorksheet("Instruções");
  inst.columns = [
    { header: "Coluna", width: 26 },
    { header: "Obrigatório", width: 12 },
    { header: "Como preencher", width: 60 },
    { header: "Exemplo", width: 34 },
    { header: "Valores aceitos", width: 60 },
  ];
  inst.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
  });
  for (const c of colunas) {
    const r = inst.addRow([c.titulo, c.obrigatorio ? "Sim" : "", c.ajuda, c.exemplo, c.opcoes?.join(", ") ?? ""]);
    r.alignment = { vertical: "top", wrapText: true };
    if (c.obrigatorio) r.getCell(2).font = { bold: true };
  }
  inst.addRow([]);
  const notas =
    tipo === "clientes"
      ? [
          "Preencha a aba Clientes, uma linha por cliente, a partir da linha 2. Não mude os nomes das colunas.",
          "Celular OU e-mail é obrigatório (pelo menos um dos dois).",
          "Clientes já cadastrados (mesmo CPF/CNPJ, e-mail ou celular) são ignorados, não duplicam.",
          `Máximo de ${MAX_LINHAS} linhas por arquivo.`,
        ]
      : [
          "Preencha a aba Embarcações, uma linha por barco, a partir da linha 2. Não mude os nomes das colunas.",
          "Fotos não vão na planilha: depois de importar, envie a foto do costado e as de detalhe na página de cada barco.",
          "Seminovos com a mesma inscrição e novos com o mesmo modelo e ano já cadastrados são ignorados, não duplicam.",
          `Máximo de ${MAX_LINHAS} linhas por arquivo.`,
        ];
  for (const n of notas) inst.addRow([n]).getCell(1).font = { italic: true };
  inst.getRow(1).height = 22;
  inst.eachRow((row, n) => {
    if (n > 1 && n <= colunas.length + 1 && n % 2 === 0)
      row.eachCell((cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GELO } }));
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Converte o valor de uma célula do Excel para texto, número ou data. */
function valorCelula(v: ExcelJS.CellValue): Valor {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v) return valorCelula(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text); // e-mails e links
    if ("error" in v) return null;
  }
  return String(v);
}

function lerCsv(buf: Buffer): string[][] {
  let txt = new TextDecoder("utf-8").decode(buf);
  if (txt.includes("�")) txt = new TextDecoder("windows-1252").decode(buf); // CSV salvo pelo Excel em português
  txt = txt.replace(/^﻿/, "");
  const primeira = txt.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (aspas) {
      if (ch === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { linha.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && txt[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += ch;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/** Lê .xlsx ou .csv e devolve as linhas com as chaves das colunas conhecidas. */
export async function lerPlanilha(buf: Buffer, nomeArquivo: string, tipo: TipoImportacao): Promise<Leitura> {
  const colunas = colunasDe(tipo);
  let tabela: Valor[][];

  if (/\.csv$/i.test(nomeArquivo)) {
    tabela = lerCsv(buf);
  } else {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buf as unknown as ArrayBuffer);
    } catch {
      throw new Error("Não consegui abrir o arquivo. Envie um Excel (.xlsx) ou CSV.");
    }
    const ws =
      wb.worksheets.find((w) => normalizar(w.name) === normalizar(NOME_ABA[tipo])) ??
      wb.worksheets.find((w) => normalizar(w.name) !== "instrucoes");
    if (!ws) throw new Error("A planilha está vazia.");
    tabela = [];
    ws.eachRow({ includeEmpty: true }, (row, n) => {
      const vals = (row.values as ExcelJS.CellValue[]).slice(1).map(valorCelula);
      tabela[n - 1] = vals;
    });
    for (let i = 0; i < tabela.length; i++) tabela[i] ??= [];
  }

  const cabecalho = (tabela[0] ?? []).map((v) => String(v ?? "").trim());
  const mapa = new Map<number, string>();
  const ignoradas: string[] = [];
  cabecalho.forEach((h, i) => {
    if (!h) return;
    const n = normalizar(h);
    const c = colunas.find((c) => normalizar(c.titulo) === n || normalizar(c.chave) === n);
    if (c) mapa.set(i, c.chave);
    else ignoradas.push(h);
  });
  const presentes = new Set(mapa.values());
  const faltando = colunas.filter((c) => c.obrigatorio && !presentes.has(c.chave)).map((c) => c.titulo);
  if (presentes.size === 0) {
    throw new Error(
      `Não reconheci nenhuma coluna. A primeira linha precisa ter os nomes das colunas do modelo de ${tipo === "clientes" ? "clientes" : "embarcações"}.`,
    );
  }

  const linhas: LinhaLida[] = [];
  for (let r = 1; r < tabela.length; r++) {
    const valores: Record<string, Valor> = {};
    let vazia = true;
    for (const [i, chave] of mapa) {
      let v = tabela[r]?.[i] ?? null;
      if (typeof v === "string") v = v.trim() || null;
      valores[chave] = v;
      if (v != null) vazia = false;
    }
    if (!vazia) linhas.push({ numero: r + 1, valores });
  }
  if (linhas.length > MAX_LINHAS) throw new Error(`O arquivo tem ${linhas.length} linhas. O máximo é ${MAX_LINHAS} por vez; divida em mais arquivos.`);
  return { linhas, ignoradas, faltando };
}
