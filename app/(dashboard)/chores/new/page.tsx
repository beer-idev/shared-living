import type { Metadata } from "next";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { getAppContext } from "@/lib/data";

export const metadata: Metadata = { title: "Create task" };

export default async function NewChorePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [context, query] = await Promise.all([getAppContext(), searchParams]);
  return <div className="min-h-[60dvh]"><CreateTaskDialog members={context.members} currentUserId={context.userId} defaultOpen showTrigger={false} error={query.error} /></div>;
}
