"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppContext } from "@/lib/data";
import { harmonyLevel } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const taskSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  dueAt: z.string().min(1),
  assignmentType: z.enum(["manual", "random", "rotation"]),
  assignedTo: z.string().optional(),
});

const databaseIdSchema = z.string().trim().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid database id",
);

function taskRedirect(taskId: string, formData: FormData, query: string) {
  const returnTo = formData.get("returnTo");
  const base = returnTo === "/chores" ? "/chores" : `/chores/${taskId}`;
  return `${base}?${query}`;
}

export async function createTaskAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/chores/new?error=Connect+Supabase+to+save+this+chore");
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/chores/new?error=Please+complete+all+required+fields");
  const context = await getAppContext();
  const supabase = await createClient();
  let assignedTo = parsed.data.assignedTo;
  if (parsed.data.assignmentType === "random") assignedTo = context.members[Math.floor(Math.random() * context.members.length)]?.user_id;
  if (parsed.data.assignmentType === "rotation") {
    const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("house_id", context.house.id).eq("assignment_type", "rotation");
    assignedTo = context.members[(count ?? 0) % Math.max(context.members.length, 1)]?.user_id;
  }
  if (!assignedTo || !context.members.some((member) => member.user_id === assignedTo)) redirect("/chores/new?error=Choose+a+valid+housemate");

  const { data, error } = await supabase.from("tasks").insert({
    house_id: context.house.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_at: new Date(parsed.data.dueAt).toISOString(),
    assignment_type: parsed.data.assignmentType,
    assigned_to: assignedTo,
    created_by: context.userId,
  }).select("id").single();
  if (error || !data) redirect(`/chores/new?error=${encodeURIComponent(error?.message ?? "Could not create chore")}`);
  revalidatePath("/dashboard");
  revalidatePath("/chores");
  redirect(`/chores/${data.id}?created=1`);
}

export async function completeTaskAction(formData: FormData) {
  const taskResult = databaseIdSchema.safeParse(formData.get("taskId"));
  if (!taskResult.success) redirect("/chores?error=This+task+link+is+invalid+or+expired");
  const taskId = taskResult.data;
  if (!isSupabaseConfigured) redirect(taskRedirect(taskId, formData, "error=Connect+Supabase+to+complete+this+chore"));
  const context = await getAppContext();
  const previousHarmony = context.house.harmony_score;
  const proof = formData.get("proof");
  if (!(proof instanceof File) || proof.size === 0) redirect(taskRedirect(taskId, formData, "error=A+completion+photo+is+required"));
  if (proof.size > 5 * 1024 * 1024) redirect(taskRedirect(taskId, formData, "error=The+photo+must+be+smaller+than+5MB"));
  const extension = proof.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${context.house.id}/${taskId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from("task-proofs").upload(path, proof, { upsert: false });
  if (uploadError) redirect(taskRedirect(taskId, formData, `error=${encodeURIComponent(uploadError.message)}`));
  const { error } = await supabase.rpc("complete_task", { p_task_id: taskId, p_photo_path: path });
  if (error) {
    await supabase.storage.from("task-proofs").remove([path]);
    redirect(taskRedirect(taskId, formData, `error=${encodeURIComponent(error.message)}`));
  }
  revalidatePath("/dashboard");
  revalidatePath("/chores");
  revalidatePath("/harmony");
  const { data: updatedHouse } = await supabase.from("houses").select("harmony_score").eq("id", context.house.id).single();
  const levelUp = updatedHouse && harmonyLevel(Number(updatedHouse.harmony_score)).level > harmonyLevel(previousHarmony).level;
  redirect(taskRedirect(taskId, formData, `completed=1&task=${taskId}${levelUp ? "&levelUp=1" : ""}`));
}

export async function reactToTaskAction(formData: FormData) {
  const taskId = databaseIdSchema.parse(formData.get("taskId"));
  const reaction = z.enum(["looks_great", "appreciate", "thanks"]).parse(formData.get("reaction"));
  if (!isSupabaseConfigured) redirect(`/chores/${taskId}?error=Connect+Supabase+to+send+appreciation`);
  const context = await getAppContext();
  const previousHarmony = context.house.harmony_score;
  const supabase = await createClient();
  const { error } = await supabase.rpc("appreciate_task", { p_task_id: taskId, p_reaction: reaction });
  if (error) redirect(`/chores/${taskId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/chores/${taskId}`);
  revalidatePath("/harmony");
  const { data: updatedHouse } = await supabase.from("houses").select("harmony_score").eq("id", context.house.id).single();
  const levelUp = updatedHouse && harmonyLevel(Number(updatedHouse.harmony_score)).level > harmonyLevel(previousHarmony).level;
  redirect(`/chores/${taskId}?reacted=1${levelUp ? "&levelUp=1" : ""}`);
}
