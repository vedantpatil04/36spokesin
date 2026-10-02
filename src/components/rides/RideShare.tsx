import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui-kit";

type CopyState = "idle" | "copied" | "failed";

/**
 * Sends one ride to another rider. Uses the device's share sheet where the
 * browser has one; elsewhere it offers Copy link and WhatsApp.
 */
export function RideShare({
  path,
  title,
  text,
}: {
  /** The ride's own page, e.g. "/rides/one-ride-2026". */
  path: string;
  title: string;
  /** One line that travels with the link. */
  text: string;
}) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<CopyState>("idle");

  useEffect(() => {
    if (copy !== "copied") return;
    const timer = window.setTimeout(() => setCopy("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [copy]);

  // Only read on the client: the fallback below renders after a click.
  const url = () => `${window.location.origin}${path}`;

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: url() });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setOpen((current) => !current);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        aria-expanded={open}
        onClick={() => void share()}
      >
        <Share2 className="size-4" aria-hidden />
        Share ride
      </Button>
      {open ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => void copyLink()}>
            {copy === "copied" ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            {copy === "copied" ? "Link copied" : "Copy link"}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            <MessageCircle className="size-3.5" aria-hidden />
            WhatsApp
          </a>
          {copy === "failed" ? (
            <label className="col-span-2 text-xs text-muted-foreground">
              Copy this link
              <input
                readOnly
                value={url()}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-1 h-9 w-full rounded-sm border border-border bg-background px-2 text-foreground"
              />
            </label>
          ) : null}
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {copy === "copied" ? "Link copied" : ""}
      </span>
    </div>
  );
}
