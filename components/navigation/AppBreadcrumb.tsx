"use client";

import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

type AppBreadcrumbProps = {
  items: Crumb[];
};

export function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded px-1 py-0.5 text-zinc-400 transition hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-zinc-200" : "text-zinc-400"}>
                  {item.label}
                </span>
              )}
              {!isLast ? <span className="text-zinc-600">&gt;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

