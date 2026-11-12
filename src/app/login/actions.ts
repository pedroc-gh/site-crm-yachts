"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { conferirSenha, encerrarSessao, iniciarSessao } from "@/lib/auth";

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return "Informe e-mail e senha.";

  const u = await db.usuario.findUnique({ where: { email } });
  const ok = u ? await conferirSenha(senha, u.senhaHash) : false;
  if (!u || !ok) return "E-mail ou senha incorretos.";
  if (!u.ativo) return "Seu acesso está desativado. Fale com o administrador.";

  await iniciarSessao(u.id, u.papel);
  redirect(u.trocarSenha ? "/trocar-senha" : "/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
