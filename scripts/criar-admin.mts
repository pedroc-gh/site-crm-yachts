// Cria (ou reativa) o primeiro administrador do CRM.
// Uso: npm run admin:create -- "Nome Completo" email@regattayachts.com.br
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const [nome, emailBruto] = process.argv.slice(2);
if (!nome || !emailBruto) {
  console.error('Uso: npm run admin:create -- "Nome Completo" email@dominio.com.br');
  process.exit(1);
}
const email = emailBruto.toLowerCase();
const senha = randomBytes(6).toString("base64url");
const db = new PrismaClient();

const senhaHash = await bcrypt.hash(senha, 10);
await db.usuario.upsert({
  where: { email },
  update: { nome, papel: "ADMIN", ativo: true, senhaHash, trocarSenha: true },
  create: { nome, email, papel: "ADMIN", senhaHash, trocarSenha: true },
});
console.log(`\nAdministrador pronto: ${nome} <${email}>\nSenha provisória: ${senha}\nNo primeiro acesso o sistema pede uma senha nova.\n`);
await db.$disconnect();
