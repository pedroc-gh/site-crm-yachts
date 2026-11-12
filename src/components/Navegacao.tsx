"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; rotulo: string } | { grupo: string };

export function Navegacao({ itens }: { itens: Item[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal">
      {itens.map((item) =>
        "grupo" in item ? (
          <div className="grupo" key={item.grupo}>
            {item.grupo}
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-current={(item.href === "/" ? path === "/" : path.startsWith(item.href)) ? "page" : undefined}
          >
            {item.rotulo}
          </Link>
        ),
      )}
    </nav>
  );
}
