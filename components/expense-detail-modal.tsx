"use client";

import { ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExpenseDetailModalProps = {
  title: string;
  category: string;
  date: string;
  total: string;
  perPerson: string;
  paidBy: string;
  members: number;
  status: "Pending" | "Settled" | "Your share paid";
  trigger?: "title";
};

export function ExpenseDetailModal({ title, category, date, total, perPerson, paidBy, members, status }: ExpenseDetailModalProps) {
  return <Dialog>
    <DialogTrigger asChild><button type="button" className="expense-card__title-button">{title}</button></DialogTrigger>
    <DialogContent className="expense-detail-dialog">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{category} · {date}</DialogDescription>
      </DialogHeader>
      <div className="expense-detail-dialog__amount"><strong>{total}</strong><span>{perPerson} per person · equal split</span></div>
      <dl className="expense-detail-dialog__facts"><div><dt>Paid by</dt><dd>{paidBy}</dd></div><div><dt>Members</dt><dd>{members}</dd></div><div><dt>Status</dt><dd className={status === "Pending" ? "is-pending" : "is-settled"}>{status}</dd></div></dl>
      <div className="expense-detail-dialog__receipt"><ReceiptText size={18} /><span>Receipt preview</span><small>Receipt image will appear here when uploaded.</small></div>
    </DialogContent>
  </Dialog>;
}
