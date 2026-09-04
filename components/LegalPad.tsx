import { ReactNode } from "react";

/** Lined yellow legal pad for recipe reading pages. */
export function LegalPad({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`legal-pad ${className}`}>
      <div className="legal-pad-page">
        <div className="legal-pad-content">{children}</div>
      </div>
    </div>
  );
}
