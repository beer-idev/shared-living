import type { Metadata } from "next";
import { X } from "lucide-react";
import Link from "next/link";
import { createExpenseAction } from "@/app/actions/expenses";
import { Avatar } from "@/components/avatar";
import { StatusMessage } from "@/components/status-message";
import { getAppContext } from "@/lib/data";

export const metadata: Metadata = { title: "Create expense" };

export default async function NewExpensePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [context, query] = await Promise.all([getAppContext(), searchParams]);
  return <main className="prototype-modal-page"><form action={createExpenseAction} className="prototype-modal prototype-modal--expense"><header><div><h1>Create expense</h1><p>Split fairly between the members you select.</p></div><Link href="/expenses" aria-label="Close"><X size={18} /></Link></header><StatusMessage error={query.error} /><label>Title<input name="title" placeholder="Water bill · August" required /></label><fieldset><legend>Category</legend><div className="choice-pills">{["electricity", "water", "internet", "grocery", "rent", "other"].map((category, index) => <label key={category}><input type="radio" name="category" value={category} defaultChecked={index === 1} /><span>{category}</span></label>)}</div></fieldset><div className="modal-two-fields"><label>Amount ({context.house.currency})<input name="amount" type="number" min="0.01" step="0.01" placeholder="1,200.00" required /></label><label>Paid by<select name="paidBy" defaultValue={context.userId}>{context.members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile.display_name}</option>)}</select></label></div><label>Date<input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Description<textarea name="description" placeholder="Monthly water bill for Sunrise House 402." /></label><fieldset><legend>Split between · Equal split</legend><div className="member-checks modal-member-checks">{context.members.map((member, index) => <label key={member.user_id}><input type="checkbox" name="members" value={member.user_id} defaultChecked /><Avatar profile={member.profile} index={index} size="sm" /><span>{member.profile.display_name}</span></label>)}</div></fieldset><div className="split-preview"><strong>฿1,200 · 4 members · ฿300.00 each</strong><small>Paid by {context.profile.display_name} · Your share is included.</small></div><label>Receipt photo <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" /></label><footer><Link href="/expenses">Cancel</Link><button className="button button--primary" type="submit">Save expense</button></footer></form></main>;
}
