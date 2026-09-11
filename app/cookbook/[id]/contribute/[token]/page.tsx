"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Old contribute links redirect to the invite flow. */
export default function ContributeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = params.token as string;

  useEffect(() => {
    router.replace(`/cookbook/${id}/invite/${token}`);
  }, [id, token, router]);

  return <div className="text-center py-12 muted">Redirecting to invite…</div>;
}
