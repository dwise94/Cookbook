import { ReactNode } from "react";

/** Recipe reading surface for Warm Kitchen Modern. */
export function RecipePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`recipe-panel ${className}`}>{children}</div>;
}
