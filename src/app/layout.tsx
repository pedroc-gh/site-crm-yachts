import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Regatta Yachts CRM", template: "%s · Regatta Yachts CRM" },
  description: "Carteira de clientes, funil de atendimento, estoque e propostas da Regatta Yachts.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Antonio:wght@300;400;500&family=Work+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
