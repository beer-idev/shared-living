import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn("flex h-10 w-full rounded-xl border border-[#dbe4e7] bg-white px-3 py-2 text-sm text-[#17291f] shadow-sm outline-none transition focus-visible:border-[#4cbd5b] focus-visible:ring-2 focus-visible:ring-[#4cbd5b]/20 placeholder:text-[#9aaba5] disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
Input.displayName = "Input";

export { Input };
