import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ReceiptPhoto({ src, title, compact = false }: { src: string; title: string; compact?: boolean }) {
  return <a
    href={src}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Open the full-size receipt for ${title}`}
    className={cn(
      "group relative block cursor-pointer overflow-hidden rounded-2xl border border-[#d4e0e1] bg-[#f2f7f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/45 focus-visible:ring-offset-2",
      compact ? "aspect-[16/9]" : "aspect-[4/3]",
    )}
  >
    <Image
      src={src}
      alt={`Receipt for ${title}`}
      fill
      sizes={compact ? "(max-width: 480px) calc(100vw - 80px), 384px" : "(max-width: 860px) calc(100vw - 80px), 340px"}
      className="object-contain p-2 transition-opacity duration-200 group-hover:opacity-95"
    />
    <span className="absolute inset-x-2 bottom-2 flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-[#17291f] shadow-sm backdrop-blur-sm transition-colors duration-200 group-hover:bg-white">
      <ExternalLink className="size-3.5 text-[#27843a]" aria-hidden="true" />
      Open full-size receipt
    </span>
  </a>;
}
