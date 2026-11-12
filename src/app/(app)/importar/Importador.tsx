"use client";
import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FormAcao } from "@/components/FormAcao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { conferirPlanilha, importarPlanilha, type ResultadoAnalise, type ResultadoImportacao } from "./actions";

type Tipo = "clientes" | "embarcacoes";
const NOMES: Record<Tipo, { plural: string; singular: string; lista: string }> = {
  clientes: { plural: "clientes", singular: "cliente", lista: "/clientes" },
  embarcacoes: { plural: "embarcações", singular: "embarcação", lista: "/embarcacoes" },
};

export function Importador({ tipo }: { tipo: Tipo }) {
  const nomes = NOMES[tipo];
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "erro" | "duplicado" | "ok">("todas");
  const [analise, conferir] = useActionState(conferirPlanilha, null);
  const [resultado, importar] = useActionState(importarPlanilha, null);

  // A importação reenvia o mesmo arquivo conferido
  const enviarImportacao = (f: FormData) => {
    if (arquivo) f.set("arquivo", arquivo);
    importar(f);
  };
  const novaAnalise = (f: FormData) => {
    setFiltro("todas");
    conferir(f);
  };

  const previa = analise && "linhas" in analise ? analise : null;
  const importado = resultado && "importados" in resultado ? resultado : null;
  const linhas = useMemo(
    () =>
      previa
        ? [...previa.linhas]
            .filter((l) => filtro === "todas" || l.status === filtro)
            .sort((a, b) => ordem(a.status) - ordem(b.status) || a.numero - b.numero)
        : [],
    [previa, filtro],
  );

  if (importado) {
    return (
      <div className="pilha" style={{ maxWidth: 720 }}>
        <div className="aviso aviso-ok" role="status">
          <strong>{plural(importado.importados, nomes.singular, nomes.plural)} {importado.importados === 1 ? (tipo === "clientes" ? "importado" : "importada") : tipo === "clientes" ? "importados" : "importadas"}.</strong>
          {importado.duplicados > 0 && <> {plural(importado.duplicados, "linha já existia e foi ignorada", "linhas já existiam e foram ignoradas")}.</>}
          {importado.erros > 0 && <> {plural(importado.erros, "linha com erro ficou de fora", "linhas com erro ficaram de fora")}; corrija e importe só elas.</>}
        </div>
        {tipo === "embarcacoes" && importado.importados > 0 && (
          <p className="muted" style={{ margin: 0 }}>Agora envie a foto do costado e as de detalhe na página de cada embarcação.</p>
        )}
        <div className="linha-flex">
          <Link className="btn btn-cta" href={nomes.lista}>Ver {nomes.plural}</Link>
          <a className="btn" href={`/importar?tipo=${tipo}`}>Importar outro arquivo</a>
        </div>
      </div>
    );
  }

  return (
    <div className="importador">
      <ol className="passos">
        <li>
          <span className="passo-num">1</span>
          <div className="pilha" style={{ gap: 8 }}>
            <h2 className="display display-sm">Baixe o modelo</h2>
            <p className="muted" style={{ margin: 0 }}>
              Planilha Excel com as colunas certas, menus nos campos de lista e uma aba de instruções com exemplos.
              Colunas com <strong className="obrig">*</strong> são obrigatórias.
            </p>
            <div><a className="btn" href={`/api/modelo/${tipo}`} download>Baixar modelo de {nomes.plural} (.xlsx)</a></div>
          </div>
        </li>
        <li>
          <span className="passo-num">2</span>
          <div className="pilha" style={{ gap: 8, minWidth: 0 }}>
            <h2 className="display display-sm">Envie para conferir</h2>
            <p className="muted" style={{ margin: 0 }}>Nada é gravado nesta etapa. O sistema aponta os erros linha a linha.</p>
            <FormAcao acao={novaAnalise} className="linha-flex">
              <input type="hidden" name="tipo" value={tipo} />
              <input
                ref={arquivoRef}
                id="arquivo"
                name="arquivo"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                required
                aria-label="Arquivo da planilha"
                style={{ maxWidth: 420 }}
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
              <BotaoEnviar className="btn btn-escuro" pendente="Conferindo…">Conferir planilha</BotaoEnviar>
            </FormAcao>
            {analise && "erro" in analise && <p className="erro" role="alert">{analise.erro}</p>}
          </div>
        </li>
        <li>
          <span className="passo-num">3</span>
          <div className="pilha" style={{ gap: 12, minWidth: 0 }}>
            <h2 className="display display-sm">Confira e importe</h2>
            {!previa ? (
              <p className="muted" style={{ margin: 0 }}>O resultado da conferência aparece aqui.</p>
            ) : (
              <>
                <div className="contagem" role="status">
                  <button type="button" className={filtro === "ok" ? "ativo" : ""} onClick={() => setFiltro(filtro === "ok" ? "todas" : "ok")}>
                    <strong>{previa.ok}</strong> prontas para importar
                  </button>
                  <button type="button" className={`dup ${filtro === "duplicado" ? "ativo" : ""}`} onClick={() => setFiltro(filtro === "duplicado" ? "todas" : "duplicado")}>
                    <strong>{previa.duplicados}</strong> já existem (serão ignoradas)
                  </button>
                  <button type="button" className={`err ${filtro === "erro" ? "ativo" : ""}`} onClick={() => setFiltro(filtro === "erro" ? "todas" : "erro")}>
                    <strong>{previa.erros}</strong> com erro (ficam de fora)
                  </button>
                </div>
                {previa.ignoradas.length > 0 && (
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    Colunas não reconhecidas, ignoradas: {previa.ignoradas.join(", ")}.
                  </p>
                )}
                <div className="tabela-wrap previa">
                  <table className="tabela">
                    <thead>
                      <tr><th>Linha</th><th>{tipo === "clientes" ? "Cliente" : "Embarcação"}</th><th>Situação</th><th>Detalhe</th></tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.numero}>
                          <td className="num">{l.numero}</td>
                          <td>{l.rotulo}</td>
                          <td>
                            <span className={`tag ${l.status === "ok" ? "tag-ok" : l.status === "erro" ? "tag-perigo" : "tag-neutro"}`}>
                              {l.status === "ok" ? "Pronta" : l.status === "erro" ? "Erro" : "Já existe"}
                            </span>
                          </td>
                          <td style={{ fontSize: 13 }}>{l.mensagens.join(" ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <FormAcao acao={enviarImportacao} className="linha-flex">
                  <input type="hidden" name="tipo" value={tipo} />
                  {previa.ok > 0 ? (
                    <BotaoEnviar pendente="Importando…">
                      Importar {previa.ok} {previa.ok === 1 ? nomes.singular : nomes.plural}
                    </BotaoEnviar>
                  ) : (
                    <button type="button" className="btn btn-cta" disabled>Nenhuma linha pronta</button>
                  )}
                  {previa.erros > 0 && previa.ok > 0 && (
                    <span className="muted" style={{ fontSize: 13 }}>Ou corrija os erros na planilha e confira de novo.</span>
                  )}
                </FormAcao>
                {resultado && "erro" in resultado && <p className="erro" role="alert">{resultado.erro}</p>}
              </>
            )}
          </div>
        </li>
      </ol>
    </div>
  );
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const ordem = (s: string) => (s === "erro" ? 0 : s === "duplicado" ? 1 : 2);
