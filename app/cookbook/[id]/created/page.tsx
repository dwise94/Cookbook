"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ShareLinkCard } from "@/components/ShareLinkCard";

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
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Cookbook created</h1>
      <p className="text-stone-600 dark:text-stone-400">
        <strong>{name}</strong> is ready. Share the contribute link so people can add recipes, or the
        read-only link so they can only browse.
      </p>

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

      <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-4 space-y-2">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">Admin</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Keep this for yourself. You’ll enter your password to manage the cookbook.
        </p>
        <input
          readOnly
          value={adminUrl}
          className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {contributeToken ? (
          <Link
            href={`/cookbook/${id}/contribute/${contributeToken}`}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-center"
          >
            Open contribute page
          </Link>
        ) : null}
        <Link
          href={`/cookbook/${id}/admin`}
          className="rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium py-2.5 text-center hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          Go to admin
        </Link>
      </div>
    </div>
  );
}
