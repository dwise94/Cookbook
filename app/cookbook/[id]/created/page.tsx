"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { PaperSheet } from "@/components/PaperSheet";

export default function CreatedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const name = searchParams.get("name") ?? "Your cookbook";
  const contributeToken = searchParams.get("token") ?? "";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const readOnlyUrl = origin ? `${origin}/cookbook/${id}` : "";
  const contributeUrl =
    origin && contributeToken ? `${origin}/cookbook/${id}/contribute/${contributeToken}` : "";
  const adminUrl = origin ? `${origin}/cookbook/${id}/admin` : "";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PaperSheet lined={false} className="space-y-2">
        <h1 className="paper-title text-2xl sm:text-3xl text-ink">Cookbook created</h1>
        <p className="muted">
          <strong className="text-ink">{name}</strong> is ready. Share the contribute link so people
          can add recipes, or the read-only link so they can only browse.
        </p>
      </PaperSheet>

      <ShareLinkCard
        title="Contribute link (add recipes)"
        description="Friends and family can view and submit recipes with this link or QR code."
        url={contributeUrl}
      />

      <ShareLinkCard
        title="Read-only link (view only)"
        description="Anyone with this link can browse recipes but cannot add new ones."
        url={readOnlyUrl}
      />

      <PaperSheet lined={false} className="space-y-2">
        <h3 className="paper-title text-lg text-ink">Admin</h3>
        <p className="text-sm muted">
          Keep this for yourself. You’ll enter your password to manage the cookbook.
        </p>
        <input readOnly value={adminUrl} className="field text-sm" />
      </PaperSheet>

      <div className="flex flex-col sm:flex-row gap-3">
        {contributeToken ? (
          <Link
            href={`/cookbook/${id}/contribute/${contributeToken}`}
            className="btn-primary text-center"
          >
            Open contribute page
          </Link>
        ) : null}
        <Link href={`/cookbook/${id}/admin`} className="btn-secondary text-center">
          Go to admin
        </Link>
      </div>
    </div>
  );
}
