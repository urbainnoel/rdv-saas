import Link from "next/link";

export default function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="font-display text-xl italic text-forest transition hover:text-forest-dark"
    >
      RDV Assistant
    </Link>
  );
}
