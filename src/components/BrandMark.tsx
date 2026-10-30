import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap font-display font-extrabold tracking-tight text-lg text-forest transition hover:text-forest-dark sm:text-xl"
    >
      RDV Assistant
    </Link>
  );
}
