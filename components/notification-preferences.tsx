"use client";

import { Activity, BellRing, WalletCards } from "lucide-react";
import { useRef } from "react";
import { Switch } from "@/components/ui/switch";

export function NotificationPreferences({ action, values }: { action: (formData: FormData) => void | Promise<void>; values: { taskReminders: boolean; billAlerts: boolean; houseActivity: boolean } }) {
  const options = [
    { name: "taskReminders", title: "Task reminders", description: "Get a reminder when a chore is due", checked: values.taskReminders, icon: BellRing },
    { name: "billAlerts", title: "Bill alerts", description: "Know when a new expense or payment is added", checked: values.billAlerts, icon: WalletCards },
    { name: "houseActivity", title: "House activity", description: "Updates about completed chores and celebrations", checked: values.houseActivity, icon: Activity },
  ];
  const formRef = useRef<HTMLFormElement>(null);

  return <form ref={formRef} action={action} className="divide-y divide-[#dfe7e9]">
    {options.map((option) => {
      const Icon = option.icon;
      return <div key={option.name} className="flex min-h-[76px] items-center gap-3 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dff6e3] text-[#267b39]"><Icon className="size-[18px]" aria-hidden="true" /></span>
        <label htmlFor={option.name} className="min-w-0 flex-1 cursor-pointer pr-2">
          <strong className="block text-sm font-semibold text-[#17291f]">{option.title}</strong>
          <span className="mt-0.5 block text-xs leading-5 text-[#718187]">{option.description}</span>
        </label>
        <Switch id={option.name} name={option.name} defaultChecked={option.checked} aria-label={option.title} onCheckedChange={() => formRef.current?.requestSubmit()} />
      </div>;
    })}
  </form>;
}
