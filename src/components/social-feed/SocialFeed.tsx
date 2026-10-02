import { ExternalLink, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { Section, SectionHeader } from "@/components/ui-kit";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { ApiSocialPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { InstagramEmbed } from "./InstagramEmbed";
import { processInstagramEmbeds } from "./instagram-script";

export function SocialFeed({
  posts,
  title = "FOLLOW THE RIDE",
  description = "See what’s happening on the road with 36 Spokes.",
  eyebrow,
  id = "social-feed",
  className,
}: {
  posts: ApiSocialPost[];
  title?: string;
  description?: string;
  eyebrow?: string;
  id?: string;
  className?: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // When carousel changes slide or re-initializes, re-process Instagram embeds & track current index
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    const handleUpdate = () => {
      setCurrent(api.selectedScrollSnap());
      // Small timeout ensures DOM elements of new slide are ready
      setTimeout(() => {
        processInstagramEmbeds();
      }, 50);
    };

    api.on("select", handleUpdate);
    api.on("reInit", handleUpdate);

    return () => {
      api.off("select", handleUpdate);
      api.off("reInit", handleUpdate);
    };
  }, [api]);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <Section id={id} className={className ?? "overflow-hidden"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader {...(eyebrow ? { eyebrow } : {})} title={title} description={description} />
        <a
          href="https://www.instagram.com/36spokes/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start font-display text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground sm:self-end"
        >
          <Instagram className="size-4" aria-hidden />
          <span>@36spokes on Instagram</span>
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>

      <div className="mt-10">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            breakpoints: {
              "(min-width: 1024px)": { loop: posts.length > 3 },
            },
            loop: posts.length > 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {posts.map((post) => (
              <CarouselItem
                key={post.id}
                className="basis-[82%] sm:basis-1/2 lg:basis-1/3 pl-3 md:pl-4"
              >
                <InstagramEmbed
                  postUrl={post.postUrl}
                  mediaType={post.mediaType}
                  caption={post.caption}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {posts.length > 1 ? (
            <div className="mt-6 flex items-center justify-between sm:justify-end gap-3">
              {/* Mobile/Tablet Dots & Counter Indicator */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
                  {posts.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-hidden",
                        current === index
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                      )}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-selected={current === index}
                      role="tab"
                    />
                  ))}
                </div>
                <span className="font-display text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {current + 1} / {posts.length}
                </span>
              </div>

              {/* Navigation Arrows: always available on mobile/tablet when >1 post, and on desktop if >3 posts */}
              <div className={cn("flex items-center gap-2", posts.length <= 3 && "lg:hidden")}>
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </div>
          ) : null}
        </Carousel>
      </div>
    </Section>
  );
}

export { InstagramEmbed };
