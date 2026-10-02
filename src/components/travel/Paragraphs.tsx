import { cn } from "@/lib/utils";

/** Editor-written text: blank lines start paragraphs, single line breaks are kept. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("max-w-prose space-y-4 leading-relaxed text-muted-foreground", className)}>
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
