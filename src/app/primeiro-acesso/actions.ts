"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashSenha, iniciarSessao } from "@/lib/auth";

/** Só funciona enquanto o banco não tem nenhum usuário: cria o primeiro administrador. */
export async function criarPrimeiroAdmin(_: string | null, form: FormData): Promise<string | null> {
  const nome = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const confirma = String(form.get("confirma") ?? "");
  if (!nome) return "Informe o seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (senha !== confirma) return "A confirmação não é igual à senha.";

  const senhaHash = await hashSenha(senha);
  // Transação serializável: dois acessos simultâneos não criam dois administradores
  const criado = await db.$transaction(
    async (tx) => {
      if ((await tx.usuario.count()) > 0) return null;
      return tx.usuario.create({ data: { nome, email, senhaHash, papel: "ADMIN", trocarSenha: false } });
    },
    { isolationLevel: "Serializable" },
  );
  if (!criado) redirect("/login");
  await iniciarSessao(criado.id, "ADMIN");
  redirect("/");
}
