"use client";

import { CookbookBrowser } from "@/components/CookbookBrowser";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ContributePage() {
  const params = useParams();
  const id = params.id as string;
  const token = params.token as string;
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/cookbooks/${id}/contribute?token=${encodeURIComponent(token)}`)
      .then((r) => {
        setValid(r.ok);
      })
      .catch(() => setValid(false));
  }, [id, token]);

  if (valid === null) {
    return (
      <div className="text-center py-12 muted">Loading…</div>
    );
  }

  if (!valid) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="muted">This contribute link is invalid or expired.</p>
        <Link href={`/cookbook/${id}`} className="text-sage hover:underline">
          View cookbook (read-only)
        </Link>
      </div>
    );
  }

  return <CookbookBrowser cookbookId={id} contributeToken={token} canSubmit />;
}
