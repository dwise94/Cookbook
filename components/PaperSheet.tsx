import { ReactNode } from "react";

/** Light surface panel for forms and page sections. */
export function PaperSheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  /** @deprecated Lined notebook style removed */
  lined?: boolean;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
}
