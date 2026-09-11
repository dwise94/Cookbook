"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { PaperSheet } from "@/components/PaperSheet";

function CreatedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const name = searchParams.get("name") ?? "Your cookbook";
  const inviteToken = searchParams.get("token") ?? "";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl =
    origin && inviteToken ? `${origin}/cookbook/${id}/invite/${inviteToken}` : "";
  const manageUrl = origin ? `${origin}/cookbook/${id}/admin` : "";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PaperSheet lined={false} className="space-y-2">
        <h1 className="paper-title text-2xl sm:text-3xl text-ink">Cookbook created</h1>
        <p className="muted">
          <strong className="text-ink">{name}</strong> is ready. Share the invite link so friends
          can join — cookbooks are invite-only.
        </p>
      </PaperSheet>

      <ShareLinkCard
        title="Invite link"
        description="Friends sign up or log in with this link to join your cookbook."
        url={inviteUrl}
      />

      <PaperSheet lined={false} className="space-y-2">
        <h3 className="paper-title text-lg text-ink">Manage</h3>
        <p className="text-sm muted">Rename the book, share invites, and manage recipes.</p>
        <input readOnly value={manageUrl} className="field text-sm" />
      </PaperSheet>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/cookbook/${id}`} className="btn-primary text-center">
          Open cookbook
        </Link>
        <Link href={`/cookbook/${id}/admin`} className="btn-secondary text-center">
          Manage
        </Link>
      </div>
    </div>
  );
}

export default function CreatedPage() {
  return (
    <Suspense
      fallback={
        <PaperSheet lined={false} className="text-center">
          <p className="muted">Loading…</p>
        </PaperSheet>
      }
    >
      <CreatedContent />
    </Suspense>
  );
}
