// Assinatura do cookie de sessão. Sem dependências de Node: roda também no middleware.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESSAO = "ry_sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 7; // 7 dias

export type DadosSessao = { sub: string; papel: "ADMIN" | "VENDEDOR" };

function chave() {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error("Defina AUTH_SECRET com pelo menos 32 caracteres no .env");
  }
  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(dados: DadosSessao) {
  return new SignJWT({ papel: dados.papel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(dados.sub)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_S}s`)
    .sign(chave());
}

export async function lerSessao(token: string | undefined): Promise<DadosSessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    if (!payload.sub) return null;
    return { sub: payload.sub, papel: payload.papel === "ADMIN" ? "ADMIN" : "VENDEDOR" };
  } catch {
    return null;
  }
}
