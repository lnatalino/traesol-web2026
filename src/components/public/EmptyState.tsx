// src/components/public/EmptyState.tsx
import { LucideIcon, Inbox } from "lucide-react";

type Props = {
  title?: string;
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function EmptyState({ title, message, icon: Icon = Inbox, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      {title && (
        <h3 className="mt-4 text-lg font-semibold text-slate-700">{title}</h3>
      )}
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
