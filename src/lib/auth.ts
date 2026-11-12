import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { COOKIE_SESSAO, DURACAO_SESSAO_S, assinarSessao, lerSessao } from "./sessao";

export type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "VENDEDOR";
  trocarSenha: boolean;
};

export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const jar = await cookies();
  const sessao = await lerSessao(jar.get(COOKIE_SESSAO)?.value);
  if (!sessao) return null;
  const u = await db.usuario.findUnique({
    where: { id: sessao.sub },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, trocarSenha: true },
  });
  if (!u || !u.ativo) return null;
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel, trocarSenha: u.trocarSenha };
});

/** Exige login. Usuário com senha provisória é levado à troca de senha. */
export async function exigirUsuario(opcoes: { permitirSenhaProvisoria?: boolean } = {}) {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (u.trocarSenha && !opcoes.permitirSenhaProvisoria) redirect("/trocar-senha");
  return u;
}

export async function exigirAdmin() {
  const u = await exigirUsuario();
  if (u.papel !== "ADMIN") redirect("/");
  return u;
}

/** Filtro de carteira: vendedor só enxerga os próprios clientes e propostas. */
export function escopoVendedor(u: UsuarioLogado) {
  return u.papel === "ADMIN" ? {} : { vendedorId: u.id };
}

export async function iniciarSessao(id: string, papel: "ADMIN" | "VENDEDOR") {
  const token = await assinarSessao({ sub: id, papel });
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

export const hashSenha = (senha: string) => bcrypt.hash(senha, 10);
export const conferirSenha = (senha: string, hash: string) => bcrypt.compare(senha, hash);

/** Senha provisória legível para entregar ao novo vendedor. */
export function gerarSenhaProvisoria() {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const digitos = "23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let s = "";
  for (let i = 0; i < 6; i++) s += letras[bytes[i] % letras.length];
  for (let i = 6; i < 10; i++) s += digitos[bytes[i] % digitos.length];
  return s.slice(0, 3).toUpperCase() + s.slice(3);
}
