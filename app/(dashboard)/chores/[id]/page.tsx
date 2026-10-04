import { notFound, redirect } from "next/navigation";
import { getTask } from "@/lib/data";

export default async function ChoreDetailCompatibilityPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const task = await getTask(id);
  if (!task) notFound();

  const next = new URLSearchParams({ task: id });
  for (const [key, value] of Object.entries(query)) {
    if (key === "task" || value == null) continue;
    if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
    else next.set(key, value);
  }
  redirect(`/chores?${next.toString()}`);
}
