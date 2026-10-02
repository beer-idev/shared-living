"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PaymentRecordedModal({ open, amount }: { open: boolean; amount: string }) {
  return <Dialog defaultOpen={open}>
    <DialogContent className="payment-recorded-dialog">
      <DialogHeader>
        <DialogTitle>Payment recorded</DialogTitle>
        <DialogDescription>Your share has been marked as paid.</DialogDescription>
      </DialogHeader>
      <div className="success-icon"><CheckCircle2 size={30} /></div>
      <strong className="payment-modal-amount">{amount}</strong>
      <p>Housemates can now see the updated payment status.</p>
      <DialogClose asChild><Link className="button button--primary button--wide" href="/expenses">Back to expenses</Link></DialogClose>
    </DialogContent>
  </Dialog>;
}
