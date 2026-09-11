"use client";

import { CookbookBrowser } from "@/components/CookbookBrowser";
import { useParams } from "next/navigation";

export default function CookbookPage() {
  const params = useParams();
  const id = params.id as string;
  return <CookbookBrowser cookbookId={id} />;
}
