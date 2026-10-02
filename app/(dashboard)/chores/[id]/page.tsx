import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Clock3, Heart, Smile, Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeTaskAction, reactToTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { CompleteTaskModal } from "@/components/complete-task-modal";
import { TaskCompletedModal } from "@/components/task-completed-modal";
import { StatusMessage } from "@/components/status-message";
import { getAppContext, getTask } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Chore details" };

export default async function ChoreDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; created?: string; completed?: string; reacted?: string; levelUp?: string }> }) {
  const [{ id }, query, context] = await Promise.all([params, searchParams, getAppContext()]);
  const task = await getTask(id);
  if (!task) notFound();
  const canComplete = task.status === "pending" && (task.assigned_to === context.userId || context.members.find((member) => member.user_id === context.userId)?.role === "owner");
  const ownTask = task.assigned_to === context.userId;
  return <div className="focused-page"><Link href="/chores" className="back-link"><ArrowLeft size={16} /> Back to chores</Link><StatusMessage error={query.error} success={query.created ? "Chore created successfully." : query.completed ? "Nice work! +10 harmony points were added." : query.reacted ? "Your appreciation was sent." : undefined} /><TaskCompletedModal open={query.completed === "1"} taskTitle={task.title} /><section className={`detail-hero ${task.status === "completed" ? "detail-hero--mint" : "detail-hero--orange"}`}><div><span className="status-pill">{task.status === "completed" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{task.status}</span><h1>{task.title}</h1><p>{task.description}</p><small>{formatDate(task.due_at)} · {formatTime(task.due_at)} · {task.assignment_type}</small></div>{task.assignee && <div className="detail-assignee"><Avatar profile={task.assignee} size="lg" /><span><small>Assigned to</small><strong>{task.assignee.display_name}</strong></span></div>}</section>{canComplete && <section className="surface action-surface"><div><p className="eyebrow">Proof of completion</p><h2>Finish this chore</h2><p>Add a photo so everyone can see the result. Completing the task adds 10 harmony points.</p></div><CompleteTaskModal action={completeTaskAction} taskId={task.id} taskTitle={task.title} /></section>}{task.status === "completed" && !ownTask && <section className="surface appreciation-surface"><div><p className="eyebrow">Community appreciation</p><h2>Let them know you noticed</h2><p>The first reaction adds a one-time +5 bonus to the person who completed this chore.</p></div><div className="reaction-actions">{[{value:"looks_great",label:"Looks great",icon:Smile},{value:"appreciate",label:"Appreciate",icon:Heart},{value:"thanks",label:"Thanks",icon:ThumbsUp}].map(({value,label,icon:Icon}) => <form action={reactToTaskAction} key={value}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="reaction" value={value} /><button><Icon size={19} /><span>{label}</span></button></form>)}</div></section>}{task.status === "completed" && ownTask && <section className="surface completion-card"><Sparkles size={24} /><div><h2>Nice work, {context.profile.display_name.split(" ")[0]}!</h2><p>Your housemates can now send appreciation. The first reaction adds a +5 bonus.</p></div><strong>+10</strong></section>}</div>;
}
