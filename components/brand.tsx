import { Home, Leaf } from "lucide-react";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className={`brand ${compact ? "brand--compact" : ""}`} aria-label="Shared Living home">
      <span className="brand__mark"><Home size={compact ? 17 : 20} strokeWidth={2.5} /><Leaf size={12} /></span>
      <span className="brand__type"><strong>Shared</strong><strong>Living</strong></span>
    </Link>
  );
}
