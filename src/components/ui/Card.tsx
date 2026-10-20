import React from "react";
import Link from "next/link";

// ==========================================
// Types
// ==========================================
export interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

// ==========================================
// Card Component
// ==========================================
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-300 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

// ==========================================
// Action Item Component (Extracted for clean code)
// ==========================================
function ActionItem({ action, light, classes }: { action: QuickAction; light: boolean; classes: string }) {
  const content = (
    <>
      {/* Badge */}
      {action.badge && (
        <span className="absolute top-2 right-2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {action.badge}
        </span>
      )}

      {/* Icon */}
      <span
        className={`${
          light ? "quick-action-tile-icon" : "icon-tile-icon"
        } transition-transform duration-300 group-hover:scale-110`}
      >
        {action.icon}
      </span>

      {/* Label */}
      <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {action.label}
      </span>

      {/* Subtitle */}
      {action.subtitle && (
        <span className="mt-1 text-center text-[10px] text-slate-500 dark:text-slate-400">
          {action.subtitle}
        </span>
      )}
    </>
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        aria-label={action.label}
        title={action.label}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={action.label}
      title={action.label}
      className={classes}
    >
      {content}
    </button>
  );
}

// ==========================================
// Quick Action Grid Component
// ==========================================
export function QuickActionGrid({
  actions,
  light = false,
}: {
  actions: QuickAction[];
  light?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {actions.map((action) => {
        const classes = `group relative flex min-h-[100px] flex-col items-center justify-center rounded-xl p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
          light ? "quick-action-tile" : "icon-tile bg-white dark:bg-slate-900"
        } ${action.disabled ? "cursor-not-allowed pointer-events-none opacity-50" : ""}`;

        return <ActionItem key={action.id} action={action} light={!!light} classes={classes} />;
      })}
    </div>
  );
}

// ==========================================
// Skeleton Component
// ==========================================
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />
  );
}

