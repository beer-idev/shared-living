"use client";

import { Camera, CheckCircle2, Heart, Sparkles, ThumbsUp, X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { reactToTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Task } from "@/lib/types";

type Action = (formData: FormData) => void | Promise<void>;

type TaskDetailModalProps = {
  task: Task;
  index?: number;
  completeAction?: Action;
  canComplete?: boolean;
  children?: ReactNode;
  autoOpen?: boolean;
  showTrigger?: boolean;
  successMode?: boolean;
};

const fallbackProfile = { id: "", display_name: "Unassigned", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true };

export function TaskDetailModal({ task, index = 0, completeAction, canComplete = false, children, autoOpen = false, showTrigger = true, successMode = false }: TaskDetailModalProps) {
  const [open, setOpen] = useState(autoOpen);
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

  return <Dialog open={open} onOpenChange={setOpen}>
    {showTrigger && <DialogTrigger asChild><span role="button" tabIndex={0} onKeyDown={onTriggerKeyDown}>{children}</span></DialogTrigger>}
    <DialogContent className="task-detail-dialog">
      <DialogHeader>
        <DialogTitle>{task.title}</DialogTitle>
        <DialogDescription>{completed ? `${assignmentLabel} assignment · completed` : `${assignmentLabel} assignment · due ${dueLabel}`}</DialogDescription>
      </DialogHeader>
      <p className="task-detail-dialog__description">{task.description || "Keep the shared space feeling good for everyone."}</p>
      <div className="task-detail-dialog__assignee"><Avatar profile={assignee} index={index} size="md" /><div><strong>{assignee.display_name}</strong><span>{completed ? "Completed the task" : `Worth ${task.assignment_type === "rotation" ? 20 : 10} system points`}</span></div></div>
      {completed ? <>
        <div className="task-proof-success"><Sparkles size={17} /><span>Proof photo uploaded</span></div>
        <p className="task-reactions-label">Send some love (bonus points)</p>
        <div className="task-reaction-grid">
          {[{ value: "appreciate", label: "Appreciate", icon: Heart, count: 2 }, { value: "thanks", label: "Thanks", icon: ThumbsUp, count: 1 }, { value: "looks_great", label: "Looks great", icon: Sparkles, count: 0 }].map(({ value, label, icon: Icon, count }) => <form action={reactToTaskAction} key={value}><input type="hidden" name="taskId" value={task.id} /><button type="submit"><Icon size={17} /><span>{label}</span><small>{count}</small></button></form>)}
        </div>
      </> : canComplete && completeAction ? <form className="task-completion-form" action={completeAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="returnTo" value="/chores" />
        <label className="task-proof-upload"><Camera size={18} /><strong>Upload proof photo</strong><span>Housemates love before / after shots</span><input name="proof" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
        <button type="submit" className="button button--primary button--wide"><CheckCircle2 size={16} /> Complete task</button>
      </form> : <div className="task-detail-dialog__notice"><X size={16} /> This task is assigned to {assignee.display_name}.</div>}
    </DialogContent>
  </Dialog>;
}
