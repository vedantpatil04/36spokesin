import { ImageOff } from "lucide-react";
import type { ReactNode } from "react";
import { dateTime, tableClasses } from "./admin-format";

export type AdminRecordRow = {
  id: string;
  thumbUrl: string | null;
  /** The title, usually a link to the editor. */
  title: ReactNode;
  subtitle?: string | undefined;
  status: ReactNode;
  cells: ReactNode[];
  updatedAt: string;
};

/** Dense CMS list used by destinations, trips and rides. */
export function AdminRecordTable({ columns, rows }: { columns: string[]; rows: AdminRecordRow[] }) {
  return (
    <>
      {/* Mobile Stacked Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-sm border border-border bg-card p-3.5 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
                {row.thumbUrl ? (
                  <img
                    src={row.thumbUrl}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="flex size-full items-center justify-center text-muted-foreground"
                    title="No images"
                  >
                    <ImageOff className="size-4" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 font-semibold leading-snug">{row.title}</div>
                  <div className="shrink-0">{row.status}</div>
                </div>
                {row.subtitle ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.subtitle}</p>
                ) : null}
              </div>
            </div>

            {columns.length > 0 ? (
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-2.5 text-xs">
                {columns.map((column, index) => (
                  <div key={column} className="min-w-0">
                    <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      {column}
                    </dt>
                    <dd className="mt-0.5 truncate text-foreground">{row.cells[index]}</dd>
                  </div>
                ))}
                <div className="col-span-2 flex items-center justify-between border-t border-border/40 pt-1.5 text-[0.65rem] text-muted-foreground">
                  <span>Updated</span>
                  <time>{dateTime.format(new Date(row.updatedAt))}</time>
                </div>
              </dl>
            ) : null}
          </article>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className={`${tableClasses.wrapper} hidden md:block`}>
        <table className={tableClasses.table}>
          <thead className={tableClasses.head}>
            <tr>
              <th scope="col" className={tableClasses.th}>
                <span className="sr-only">Image</span>
              </th>
              <th scope="col" className={tableClasses.th}>
                Name
              </th>
              {columns.map((column) => (
                <th key={column} scope="col" className={tableClasses.th}>
                  {column}
                </th>
              ))}
              <th scope="col" className={tableClasses.th}>
                Status
              </th>
              <th scope="col" className={tableClasses.th}>
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={tableClasses.row}>
                <td className={`${tableClasses.td} w-20`}>
                  <div className="h-10 w-16 overflow-hidden rounded-sm border border-border bg-surface">
                    {row.thumbUrl ? (
                      <img
                        src={row.thumbUrl}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="flex size-full items-center justify-center text-muted-foreground"
                        title="No images"
                      >
                        <ImageOff className="size-4" aria-hidden />
                        <span className="sr-only">No images</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className={tableClasses.td}>
                  <span className="font-semibold">{row.title}</span>
                  {row.subtitle ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.subtitle}</p>
                  ) : null}
                </td>
                {row.cells.map((cell, index) => (
                  <td key={index} className={`${tableClasses.td} text-muted-foreground`}>
                    {cell}
                  </td>
                ))}
                <td className={tableClasses.td}>{row.status}</td>
                <td className={`${tableClasses.td} whitespace-nowrap text-xs text-muted-foreground`}>
                  {dateTime.format(new Date(row.updatedAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
