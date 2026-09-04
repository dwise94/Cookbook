"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function ShareLinkCard({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm whitespace-nowrap"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {url && (
        <div className="flex justify-center pt-2">
          <div className="rounded-lg bg-white p-3 border border-stone-200">
            <QRCodeSVG value={url} size={160} level="M" />
          </div>
        </div>
      )}
    </div>
  );
}
