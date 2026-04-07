"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-rust mx-auto mb-4" />
        <h1 className="font-[var(--font-heading)] text-2xl text-ink mb-2">
          Something went wrong
        </h1>
        <p className="text-ink-muted mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-forest text-cream hover:bg-forest-deep"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
