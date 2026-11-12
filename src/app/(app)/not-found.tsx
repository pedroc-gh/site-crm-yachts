import Link from "next/link";
export default function NaoEncontrado() {
  return (
    <div className="vazio">
      <p className="display display-md">Não encontrado</p>
      <p>Este registro não existe ou não está na sua carteira.</p>
      <Link className="btn" href="/">Voltar ao painel</Link>
    </div>
  );
}
