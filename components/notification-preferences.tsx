"use client";

import { useRef } from "react";
import { Switch } from "@/components/ui/switch";

export function NotificationPreferences({ action, values }: { action: (formData: FormData) => void | Promise<void>; values: { taskReminders: boolean; billAlerts: boolean; houseActivity: boolean } }) {
  const options = [
    { name: "taskReminders", title: "Task reminders", description: "New assignments and upcoming deadlines", checked: values.taskReminders },
    { name: "billAlerts", title: "Bill alerts", description: "New expenses and outstanding payments", checked: values.billAlerts },
    { name: "houseActivity", title: "House activity", description: "Completed chores and celebrations", checked: values.houseActivity },
  ];
  const formRef = useRef<HTMLFormElement>(null);
  return <form ref={formRef} action={action} className="figma-preferences">{options.map((option) => <label key={option.name}><strong>{option.title}</strong><span>{option.description}</span><Switch name={option.name} defaultChecked={option.checked} className="absolute right-5 top-5" onCheckedChange={() => formRef.current?.requestSubmit()} /><em>{option.checked ? "Enabled" : "Disabled"}</em></label>)}</form>;
}
