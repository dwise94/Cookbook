import { ReactNode } from "react";

export function PaperSheet({
  children,
  className = "",
  lined = true,
}: {
  children: ReactNode;
  className?: string;
  lined?: boolean;
}) {
  return (
    <div className={`${lined ? "paper-sheet" : "paper-sheet-plain"} ${className}`}>
      {children}
    </div>
  );
}
