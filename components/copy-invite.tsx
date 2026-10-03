"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInviteButton({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${encodeURIComponent(code)}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <Button type="button" variant={copied ? "secondary" : "outline"} size={compact ? "icon" : "default"} className={compact ? "size-10 shrink-0" : "shrink-0"} onClick={copy} aria-label={copied ? "Invite link copied" : "Copy invite link"}>
    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{!compact && <span>{copied ? "Copied" : "Copy"}</span>}
  </Button>;
}
