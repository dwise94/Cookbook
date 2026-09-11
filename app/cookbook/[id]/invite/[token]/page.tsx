"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PaperSheet } from "@/components/PaperSheet";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "need-auth" | "joining" | "error" | "done">(
    "loading"
  );
  const [error, setError] = useState("");
  const [cookbookName, setCookbookName] = useState("");
  const returnPath = `/cookbook/${id}/invite/${token}`;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const check = await fetch(
        `/api/cookbooks/${id}/invite?token=${encodeURIComponent(token)}`
      );
      const data = await check.json();
      if (cancelled) return;
      if (!check.ok) {
        setStatus("error");
        setError(data.error ?? "Invalid invite link.");
        return;
      }
      setCookbookName(data.name ?? "");
      if (data.alreadyMember) {
        router.replace(`/cookbook/${id}`);
        return;
      }
      if (!data.loggedIn) {
        setStatus("need-auth");
        return;
      }
      setStatus("joining");
      const join = await fetch(`/api/cookbooks/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const joinData = await join.json();
      if (cancelled) return;
      if (!join.ok) {
        setStatus("error");
        setError(joinData.error ?? "Could not join cookbook.");
        return;
      }
      setStatus("done");
      router.replace(`/cookbook/${id}`);
    }
    run().catch(() => {
      if (!cancelled) {
        setStatus("error");
        setError("Network error.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, token, router]);

  if (status === "loading" || status === "joining" || status === "done") {
    return (
      <PaperSheet lined={false} className="text-center space-y-2">
        <p className="muted">
          {status === "joining" ? "Joining cookbook…" : "Checking invite…"}
        </p>
      </PaperSheet>
    );
  }

  if (status === "need-auth") {
    return (
      <PaperSheet lined={false} className="max-w-md mx-auto text-center space-y-4">
        <h1 className="paper-title text-2xl text-ink">You&apos;re invited</h1>
        <p className="muted">
          {cookbookName
            ? `Join “${cookbookName}” — create an account or log in to continue.`
            : "Create an account or log in to join this cookbook."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/signup?next=${encodeURIComponent(returnPath)}`}
            className="btn-primary"
          >
            Sign up
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(returnPath)}`}
            className="btn-secondary"
          >
            Log in
          </Link>
        </div>
      </PaperSheet>
    );
  }

  return (
    <PaperSheet lined={false} className="text-center space-y-3">
      <p className="muted">{error || "Invalid invite."}</p>
      <Link href="/" className="text-sage hover:underline">
        Go home
      </Link>
    </PaperSheet>
  );
}
