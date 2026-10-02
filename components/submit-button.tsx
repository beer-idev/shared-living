"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Saving…", className = "button button--primary" }: { children: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <Button className={className} type="submit" disabled={pending} aria-disabled={pending}>{pending && <LoaderCircle className="spin" size={16} />}{pending ? pendingLabel : children}</Button>;
}
