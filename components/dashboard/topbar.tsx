"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-6">
      <span className="text-lg font-bold tracking-tight">ProfilePulse</span>
      <Button variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Sync Now
      </Button>
    </header>
  );
}
