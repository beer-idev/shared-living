"use client";

import { Camera, CheckCircle2, Heart, Sparkles, ThumbsUp, X } from "lucide-react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { reactToTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { uploadPhoto } from "@/components/upload-photo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Task } from "@/lib/types";

type Action = (formData: FormData) => void | Promise<void>;

type TaskDetailModalProps = {
  task: Task;
  currentUserId?: string;
  index?: number;
  completeAction?: Action;
  canComplete?: boolean;
  children?: ReactNode;
  autoOpen?: boolean;
  showTrigger?: boolean;
  successMode?: boolean;
};

const fallbackProfile = { id: "", display_name: "Unassigned", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true };

export function TaskDetailModal({ task, currentUserId, index = 0, completeAction, canComplete = false, children, autoOpen = false, showTrigger = true, successMode = false }: TaskDetailModalProps) {
  const [open, setOpen] = useState(autoOpen);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [proofName, setProofName] = useState("");
  const assignee = task.assignee ?? fallbackProfile;
  const completed = successMode || task.status === "completed";
  const assignmentLabel = task.assignment_type[0].toUpperCase() + task.assignment_type.slice(1);
  const dueLabel = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(task.due_at));

  function onTriggerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeAction || !currentUserId) return;
    const data = new FormData(event.currentTarget);
    const proof = data.get("proof");
    data.delete("proof");
    setSubmitting(true);
    setUploadError("");
    try {
      if (!(proof instanceof File)) throw new Error("Choose a proof photo");
      data.set("proofUrl", await uploadPhoto(proof, `task-proofs/${task.id}/${currentUserId}`));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Photo could not be uploaded");
      setSubmitting(false);
      return;
    }
    // Let Next.js handle redirect() from the server action instead of treating
    // it like an upload failure.
    await completeAction(data);
    setSubmitting(false);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    {showTrigger && <DialogTrigger asChild><span role="button" tabIndex={0} onKeyDown={onTriggerKeyDown}>{children}</span></DialogTrigger>}
    <DialogContent className="task-detail-dialog">
      <DialogHeader>
        <DialogTitle>{task.title}</DialogTitle>
        <DialogDescription>{completed ? `${assignmentLabel} assignment · completed` : `${assignmentLabel} assignment · due ${dueLabel}`}</DialogDescription>
      </DialogHeader>
      <p className="task-detail-dialog__description">{task.description || "Keep the shared space feeling good for everyone."}</p>
      <div className="task-detail-dialog__assignee"><Avatar profile={assignee} index={index} size="md" /><div><strong>{assignee.display_name}</strong><span>{completed ? "Completed the task" : "+10 system points when completed"}</span></div></div>
      {completed && task.assigned_to === currentUserId ? <div className="task-detail-dialog__notice">Your housemates can react to your completed task for a one-time +5 bonus.{task.completion_photo_path && <a href={task.completion_photo_path} target="_blank" rel="noopener noreferrer" className="block pt-2 font-semibold underline">View proof photo</a>}</div> : completed ? <>
        <div className="task-proof-success"><Sparkles size={17} /><span>Proof photo uploaded</span></div>
        {task.completion_photo_path && <a href={task.completion_photo_path} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#2f913f] underline">View proof photo</a>}
        <p className="task-reactions-label">Send some love (bonus points)</p>
        <div className="task-reaction-grid">
          {[{ value: "appreciate", label: "Appreciate", icon: Heart }, { value: "thanks", label: "Thanks", icon: ThumbsUp }, { value: "looks_great", label: "Looks great", icon: Sparkles }].map(({ value, label, icon: Icon }) => <form action={reactToTaskAction} key={value}><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="reaction" value={value} /><input type="hidden" name="returnTo" value="/chores" /><button type="submit" aria-pressed={task.my_reaction === value} className={task.my_reaction === value ? "is-selected" : undefined}><Icon size={17} /><span>{label}</span><small>{task.reaction_counts?.[value as "appreciate" | "thanks" | "looks_great"] ?? 0}</small></button></form>)}
        </div>
      </> : canComplete && completeAction ? <form className="task-completion-form" onSubmit={complete}>
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="returnTo" value="/chores" />
        <label className="task-proof-upload"><Camera size={18} /><strong>{proofName || "Upload proof photo"}</strong><span>{proofName ? "Photo selected · choose another if needed" : "Housemates love before / after shots"}</span><input name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProofName(event.target.files?.[0]?.name ?? "")} required /></label>
        {uploadError && <p role="alert" className="text-sm text-[#b42334]">{uploadError}</p>}
        <button type="submit" disabled={submitting} className="button button--primary button--wide"><CheckCircle2 size={16} /> {submitting ? "Uploading photo…" : "Complete task"}</button>
      </form> : <div className="task-detail-dialog__notice"><X size={16} /> This task is assigned to {assignee.display_name}.</div>}
    </DialogContent>
  </Dialog>;
}
