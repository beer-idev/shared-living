"use client";

import { Check, Copy, Plus } from "lucide-react";
import { useState } from "react";

export function CopyInviteButton({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const value = `${window.location.origin}/join/${encodeURIComponent(code)}`;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  if (compact) return <button type="button" onClick={copy} title={copied ? "Copied" : "Copy invite code"} aria-label={copied ? "Invite code copied" : "Copy invite code"}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
  return <button type="button" className="button button--secondary invite-button" onClick={copy}>{copied ? <Check size={18} /> : <Plus size={18} />}{copied ? "Invite link copied" : "Copy invite link"}</button>;
}
