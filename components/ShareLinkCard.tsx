"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PaperSheet } from "@/components/PaperSheet";

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
    <PaperSheet lined={false} className="space-y-3">
      <div>
        <h3 className="paper-title text-lg text-ink">{title}</h3>
        <p className="text-sm muted">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input readOnly value={url} className="field flex-1 text-sm sm:text-base" />
        <button type="button" onClick={copy} className="btn-primary shrink-0">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {url && (
        <div className="flex justify-center pt-1">
          <div className="rounded-md bg-white p-3 border border-ink/10">
            <QRCodeSVG value={url} size={148} level="M" />
          </div>
        </div>
      )}
    </PaperSheet>
  );
}
