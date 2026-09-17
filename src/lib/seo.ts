/**
 * Route metadata builder.
 *
 * Every leaf route calls `seo()` from its `head`. TanStack merges meta tags by
 * name/property (deepest route wins) but does not dedupe <link> tags, so only
 * leaf routes should pass `path`; layout routes must not emit a canonical.
 *
 * Canonical and og:url are only emitted when VITE_SITE_URL is set, because
 * relative canonicals are ignored or misread by crawlers.
 */

import type { JSX } from "react";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import type { MediaAsset } from "@/types";

type MetaTag = JSX.IntrinsicElements["meta"];
type LinkTag = JSX.IntrinsicElements["link"];

export type SeoOptions = {
  title: string;
  description: string;
  /** Pathname for canonical and og:url, e.g. "/garage". Omit on layout routes. */
  path?: string;
  /** Social card overrides. Default to title and description. */
  socialTitle?: string;
  socialDescription?: string;
  image?: MediaAsset;
  type?: "website" | "article" | "product";
  /** Keep account and member pages out of search results. */
  noIndex?: boolean;
};

/** Absolute URL when VITE_SITE_URL is configured, otherwise the path unchanged. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl) || !env.siteUrl) return pathOrUrl;
  return `${env.siteUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function seo(options: SeoOptions): { meta: MetaTag[]; links: LinkTag[] } {
  const socialTitle = options.socialTitle ?? options.title;
  const socialDescription = options.socialDescription ?? options.description;

  const meta: MetaTag[] = [
    { title: options.title },
    { name: "description", content: options.description },
    { property: "og:title", content: socialTitle },
    { property: "og:description", content: socialDescription },
    { name: "twitter:title", content: socialTitle },
    { name: "twitter:description", content: socialDescription },
  ];
  const links: LinkTag[] = [];

  if (options.type) meta.push({ property: "og:type", content: options.type });

  if (options.image) {
    const image = absoluteUrl(options.image.src);
    meta.push(
      { property: "og:image", content: image },
      { property: "og:image:alt", content: options.image.alt },
      { name: "twitter:image", content: image },
    );
  }

  if (options.noIndex) meta.push({ name: "robots", content: "noindex, nofollow" });

  if (options.path !== undefined && env.siteUrl) {
    const url = absoluteUrl(options.path);
    meta.push({ property: "og:url", content: url });
    links.push({ rel: "canonical", href: url });
  }

  return { meta, links };
}

/** Site-wide defaults, emitted once by the root route. */
export function rootSeo(): MetaTag[] {
  const image = absoluteUrl(site.socialImagePath);
  return [
    { title: site.defaultTitle },
    { name: "description", content: site.defaultDescription },
    { property: "og:site_name", content: site.name },
    { property: "og:locale", content: site.locale },
    { property: "og:title", content: site.defaultTitle },
    { property: "og:description", content: site.defaultSocialDescription },
    { property: "og:type", content: "website" },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
  ];
}
