import type { ReactNode } from "react";
import { BrandCrest, BrandWordmark, Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";

/** Split layout shared by Login and Join: brand panel with form beside a photograph. */
export function AuthLayout({
  image,
  imageAlt,
  imageSide,
  portalLabel,
  eyebrow,
  title,
  note,
  children,
  footer,
}: {
  image: MediaAsset;
  imageAlt: string;
  imageSide: "left" | "right";
  portalLabel: string;
  eyebrow: string;
  title: string;
  note: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const imageFirst = imageSide === "left";
  return (
    <div className="grid lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2">
      <div
        className={cn(
          "flex items-center justify-center px-5 py-14 lg:px-16",
          !imageFirst && "order-2 lg:order-1",
        )}
      >
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <BrandCrest className="size-12 ring-2 ring-primary/40 shadow-md" />
            <div>
              <p className="font-display text-sm tracking-[0.2em] text-foreground">
                <BrandWordmark accentDot={false} />
              </p>
              <p className="text-xs text-muted-foreground">{portalLabel}</p>
            </div>
          </div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{note}</p>
          {children}
          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
      <Media
        asset={image}
        alt={imageAlt}
        ratio="auto"
        className={cn(
          "h-56 lg:h-auto",
          imageFirst ? "lg:order-first" : "order-1 lg:order-2",
          imageFirst && "order-first",
        )}
      />
    </div>
  );
}
