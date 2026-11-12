import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth";
import { data, telefone } from "@/lib/formato";
import { FormNovoUsuario, FormRedefinirSenha } from "./Formularios";
import { alternarAtivo, atualizarUsuario, transferirCarteira } from "./actions";

export const metadata = { title: "Equipe" };

export default async function Usuarios() {
  const admin = await exigirAdmin();
  const usuarios = await db.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { clientes: true, propostas: true } } },
  });
  const ativos = usuarios.filter((u) => u.ativo);

  return (
    <>
      <header className="cabecalho">
        <div className="titulos">
          <p className="eyebrow">Administração</p>
          <h1 className="display display-lg">Equipe</h1>
        </div>
      </header>

      <section className="secao" style={{ marginBottom: 48, maxWidth: 960 }}>
        <header><h2 className="display display-sm">Cadastrar consultor</h2></header>
        <p className="muted" style={{ margin: 0 }}>
          O sistema gera uma senha provisória. Envie ao consultor junto com o endereço do CRM; no primeiro acesso ele define a senha pessoal.
        </p>
        <FormNovoUsuario />
      </section>

      <section className="secao">
        <header><h2 className="display display-sm">Acessos</h2><span className="muted" style={{ fontSize: 13 }}>{ativos.length} ativo(s)</span></header>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr><th>Nome</th><th>Perfil e celular</th><th className="direita">Clientes</th><th className="direita">Propostas</th><th>Situação</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={u.ativo ? undefined : { opacity: 0.6 }}>
                  <td>
                    <strong style={{ fontWeight: 500 }}>{u.nome}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{u.email} · desde {data(u.criadoEm)}</div>
                  </td>
                  <td>
                    <form action={atualizarUsuario} className="linha-flex" style={{ flexWrap: "nowrap" }}>
                      <input type="hidden" name="id" value={u.id} />
                      <select name="papel" defaultValue={u.papel} disabled={u.id === admin.id} aria-label="Perfil" style={{ width: 140, minHeight: 34, padding: "4px 8px", fontSize: 13 }}>
                        <option value="VENDEDOR">Consultor</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                      <input name="telefone" defaultValue={u.telefone ? telefone(u.telefone) : ""} aria-label="Celular" placeholder="Celular" style={{ width: 140, minHeight: 34, padding: "4px 8px", fontSize: 13 }} />
                      <button className="btn btn-sm">Salvar</button>
                    </form>
                  </td>
                  <td className="direita num">{u._count.clientes}</td>
                  <td className="direita num">{u._count.propostas}</td>
                  <td>
                    <span className={`tag ${u.ativo ? "tag-ok" : "tag-neutro"}`}>{u.ativo ? (u.trocarSenha ? "Aguardando 1º acesso" : "Ativo") : "Desativado"}</span>
                  </td>
                  <td>
                    <div className="pilha" style={{ gap: 8 }}>
                      <FormRedefinirSenha id={u.id} />
                      {u.id !== admin.id && (
                        <form action={alternarAtivo}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className={`btn btn-sm ${u.ativo ? "btn-perigo" : ""}`}>{u.ativo ? "Desativar acesso" : "Reativar acesso"}</button>
                        </form>
                      )}
                      {u._count.clientes > 0 && (
                        <form action={transferirCarteira} className="linha-flex" style={{ flexWrap: "nowrap" }}>
                          <input type="hidden" name="de" value={u.id} />
                          <select name="para" defaultValue="" aria-label="Transferir carteira para" style={{ width: 150, minHeight: 32, padding: "2px 6px", fontSize: 12 }}>
                            <option value="" disabled>Transferir carteira…</option>
                            {ativos.filter((x) => x.id !== u.id).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                          </select>
                          <button className="btn btn-sm">OK</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
