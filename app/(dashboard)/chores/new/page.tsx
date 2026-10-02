import type { Metadata } from "next";
import { X } from "lucide-react";
import Link from "next/link";
import { createTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { StatusMessage } from "@/components/status-message";
import { getAppContext } from "@/lib/data";

export const metadata: Metadata = { title: "Create task" };

export default async function NewChorePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [context, query] = await Promise.all([getAppContext(), searchParams]);
  return <main className="prototype-modal-page"><form action={createTaskAction} className="prototype-modal prototype-modal--task"><header><div><h1>Create task</h1><p>Give everyone a clear part to play.</p></div><Link href="/chores" aria-label="Close"><X size={18} /></Link></header><StatusMessage error={query.error} /><label>Task name<input name="title" defaultValue="Balcony sweep" required /></label><label>Description<textarea name="description" defaultValue="Sweep the balcony and empty the dustpan." /></label><label>Due date<input name="dueAt" type="datetime-local" required /></label><fieldset><legend>Assignment type</legend><div className="choice-pills choice-pills--three">{(["manual", "random", "rotation"] as const).map((type, index) => <label key={type}><input type="radio" name="assignmentType" value={type} defaultChecked={index === 0} /><span>{type[0].toUpperCase() + type.slice(1)}</span></label>)}</div></fieldset><fieldset><legend>Assign to</legend><div className="member-radios modal-member-radios">{context.members.map((member, index) => <label key={member.user_id}><input type="radio" name="assignedTo" value={member.user_id} defaultChecked={member.user_id === context.userId} /><Avatar profile={member.profile} index={index} size="sm" /><span>{member.profile.display_name}</span></label>)}</div></fieldset><div className="task-score-note">Complete with a photo to earn System Score +10.</div><footer><Link href="/chores">Cancel</Link><button className="button button--primary" type="submit">Create task</button></footer></form></main>;
}
