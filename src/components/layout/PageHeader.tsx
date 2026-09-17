import type { ReactNode } from "react";
import { Media } from "@/components/ui-kit";
import type { MediaAsset } from "@/types";

/** Standard editorial page header used by every pillar and detail page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: MediaAsset;
  /** Overrides the asset's alt text for this page. */
  imageAlt?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative border-b border-border">
      {image ? (
        <div className="absolute inset-0">
          <Media
            asset={image}
            {...(imageAlt !== undefined ? { alt: imageAlt } : {})}
            ratio="auto"
            className="h-full w-full"
            priority
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          </Media>
        </div>
      ) : null}
      <div className="container-page relative py-16 md:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </header>
  );
}
