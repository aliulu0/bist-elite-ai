"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-border/50 p-4 text-muted">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      {description && <p className="mb-4 text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
