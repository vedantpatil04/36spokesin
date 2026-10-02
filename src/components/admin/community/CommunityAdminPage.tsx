import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Button } from "@/components/ui-kit";
import type { ApiContentStatus } from "@/lib/api";
import type { AdminResource } from "@/services/admin/community";
import { describeError } from "@/services/request-helpers";
import { dateTime, tableClasses } from "../admin-format";
import { AdminPageHeader, AdminPanel, InlineError, ProductStatusBadge } from "../admin-ui";
import { useCatalogRefresh } from "../use-admin";

type Record = { id: string; status: ApiContentStatus; updatedAt: string };

export type CommunityRow = { thumbUrl: string | null; title: string; subtitle?: string | null };

/**
 * One CMS screen for a community resource: the list in display order with
 * publish, archive and keyboard-accessible reordering, and an inline editor.
 * Every action saves immediately; the API enforces the ADMIN role.
 */
export function CommunityAdminPage<T extends Record>({
  title,
  description,
  noun,
  resourceKey,
  api,
  toRow,
  renderForm,
  icon,
}: {
  title: string;
  description: string;
  /** Lower-case singular, e.g. "founder". */
  noun: string;
  resourceKey: string;
  api: AdminResource<T, never>;
  toRow: (item: T) => CommunityRow;
  renderForm: (props: { item: T | null; onDone: () => void; onCancel: () => void }) => ReactNode;
  icon: Parameters<typeof EmptyState>[0]["icon"];
}) {
  const queryKey = ["admin", "community", resourceKey];
  const refresh = useCatalogRefresh();
  const items = useQuery({ queryKey, queryFn: () => api.list() });
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await refresh(queryKey);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  const move = (list: T[], index: number, offset: -1 | 1) => {
    const target = index + offset;
    const moved = list[index];
    if (!moved || target < 0 || target >= list.length) return;
    const order = list.map((item) => item.id);
    order.splice(index, 1);
    order.splice(target, 0, moved.id);
    void run(moved.id, () => api.reorder(order));
  };

  const locked = editing !== null || busyId !== null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Community"
        title={title}
        description={description}
        actions={
          <Button size="sm" onClick={() => setEditing("new")} disabled={editing !== null}>
            <Plus className="size-3.5" aria-hidden />
            New {noun}
          </Button>
        }
      />

      {editing ? (
        <AdminPanel title={editing === "new" ? `New ${noun}` : `Edit ${noun}`}>
          {renderForm({
            item: editing === "new" ? null : editing,
            onDone: () => {
              setEditing(null);
              void refresh(queryKey);
            },
            onCancel: () => setEditing(null),
          })}
        </AdminPanel>
      ) : null}

      <AdminPanel
        title={`All ${title.toLowerCase()}`}
        description="Shown on the site in this order. Only published entries are public."
      >
        {items.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : items.isError ? (
          <ErrorState
            title={`${title} didn't load`}
            description={describeError(items.error)}
            onRetry={() => void items.refetch()}
          />
        ) : items.data.length === 0 ? (
          <EmptyState
            icon={icon}
            title={`No ${title.toLowerCase()} yet`}
            description={`Use “New ${noun}” to add the first one.`}
          />
        ) : (
          <>
            <InlineError message={error} />
            <div className={`${tableClasses.wrapper} mt-2`}>
              <table className={tableClasses.table}>
                <thead className={tableClasses.head}>
                  <tr>
                    <th scope="col" className={tableClasses.th}>
                      <span className="sr-only">Image</span>
                    </th>
                    <th scope="col" className={tableClasses.th}>
                      Name
                    </th>
                    <th scope="col" className={tableClasses.th}>
                      Status
                    </th>
                    <th scope="col" className={`${tableClasses.th} text-center`}>
                      Order
                    </th>
                    <th scope="col" className={tableClasses.th}>
                      Updated
                    </th>
                    <th scope="col" className={`${tableClasses.th} text-right`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.data.map((item, index) => {
                    const row = toRow(item);
                    const archived = item.status === "ARCHIVED";
                    const published = item.status === "PUBLISHED";
                    return (
                      <tr key={item.id} className={tableClasses.row}>
                        <td className={`${tableClasses.td} w-16`}>
                          <div className="size-12 overflow-hidden rounded-sm border border-border bg-surface">
                            {row.thumbUrl ? (
                              <img
                                src={row.thumbUrl}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                        </td>
                        <td className={tableClasses.td}>
                          <span className="font-semibold">{row.title}</span>
                          {row.subtitle ? (
                            <p className="mt-0.5 max-w-sm truncate text-xs text-muted-foreground">
                              {row.subtitle}
                            </p>
                          ) : null}
                        </td>
                        <td className={tableClasses.td}>
                          <ProductStatusBadge status={item.status} />
                        </td>
                        <td className={`${tableClasses.td} text-center`}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => move(items.data, index, -1)}
                              disabled={locked || index === 0}
                              aria-label={`Move ${row.title} up`}
                              className="flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(items.data, index, 1)}
                              disabled={locked || index === items.data.length - 1}
                              aria-label={`Move ${row.title} down`}
                              className="flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="size-4" aria-hidden />
                            </button>
                          </div>
                        </td>
                        <td
                          className={`${tableClasses.td} whitespace-nowrap text-xs text-muted-foreground`}
                        >
                          {dateTime.format(new Date(item.updatedAt))}
                        </td>
                        <td className={tableClasses.td}>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void run(item.id, () =>
                                  api.update(item.id, {
                                    status: published ? "DRAFT" : archived ? "DRAFT" : "PUBLISHED",
                                  } as never),
                                )
                              }
                              disabled={locked}
                              aria-label={
                                published
                                  ? `Unpublish ${row.title}`
                                  : archived
                                    ? `Restore ${row.title} as a draft`
                                    : `Publish ${row.title}`
                              }
                              title={
                                published ? "Unpublish" : archived ? "Restore as draft" : "Publish"
                              }
                            >
                              {busyId === item.id ? (
                                <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                              ) : published ? (
                                <EyeOff className="size-3.5" aria-hidden />
                              ) : archived ? (
                                <RotateCcw className="size-3.5" aria-hidden />
                              ) : (
                                <Eye className="size-3.5" aria-hidden />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditing(item)}
                              disabled={locked}
                              aria-label={`Edit ${row.title}`}
                              title="Edit"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Archive “${row.title}”? It will be removed from the site.`,
                                  )
                                )
                                  void run(item.id, () => api.archive(item.id));
                              }}
                              disabled={locked || archived}
                              aria-label={`Archive ${row.title}`}
                              title="Archive"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminPanel>
    </div>
  );
}
