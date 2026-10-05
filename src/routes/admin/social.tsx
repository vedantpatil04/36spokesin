import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Instagram,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  Video as VideoIcon,
  Image as ImageIcon,
} from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { dateTime, tableClasses } from "@/components/admin/admin-format";
import {
  AdminPageHeader,
  AdminPanel,
  Field,
  InlineError,
  ProductStatusBadge,
} from "@/components/admin/admin-ui";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiAdminSocialPost, ApiSocialPostStatus } from "@/lib/api";
import {
  archiveSocialPost,
  createSocialPost,
  listAdminSocialPosts,
  reorderSocialPosts,
  updateSocialPost,
} from "@/services/admin/social-posts";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/social")({
  component: SocialPage,
});

function isValidInstagramUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host !== "instagram.com" && host !== "www.instagram.com" && host !== "m.instagram.com") {
      return false;
    }
    return Boolean(parsed.pathname.match(/^\/(p|reel|reels)\/([A-Za-z0-9_-]+)/i));
  } catch {
    return false;
  }
}

function SocialPage() {
  const queryClient = useQueryClient();
  const posts = useQuery({
    queryKey: ["admin", "social-posts"],
    queryFn: () => listAdminSocialPosts(),
  });
  const [editing, setEditing] = useState<ApiAdminSocialPost | "new" | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "social-posts"] });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Social feed"
        description="Manage the official Instagram embeds on the homepage. Simply paste any Instagram Post or Reel URL — Instagram's official player renders the live media, profile and interactions."
        actions={
          <Button size="sm" onClick={() => setEditing("new")} disabled={editing !== null}>
            <Plus className="size-3.5" aria-hidden />
            New social post
          </Button>
        }
      />

      {editing ? (
        <AdminPanel
          title={editing === "new" ? "New Instagram Post" : "Edit Instagram Post"}
          description="Paste an Instagram URL (Post or Reel), choose a status and set display order. The official embed renders automatically on the homepage."
        >
          <SocialPostForm
            key={editing === "new" ? "new" : editing.id}
            post={editing === "new" ? null : editing}
            nextSortOrder={posts.data?.length ?? 0}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        </AdminPanel>
      ) : null}

      <AdminPanel
        title="All posts"
        description="Only PUBLISHED posts are displayed on the public website. Reorder posts using arrows to control positioning on the homepage."
      >
        {posts.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : posts.isError ? (
          <ErrorState title="Social posts didn't load" onRetry={() => void posts.refetch()} />
        ) : posts.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No social posts yet. Click &ldquo;New social post&rdquo; to add your first post.
          </p>
        ) : (
          <SocialPostsTable
            posts={posts.data}
            onEdit={setEditing}
            disabled={editing !== null}
            onRefresh={refresh}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function SocialPostsTable({
  posts,
  onEdit,
  disabled,
  onRefresh,
}: {
  posts: ApiAdminSocialPost[];
  onEdit: (post: ApiAdminSocialPost) => void;
  disabled: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleStatus = async (post: ApiAdminSocialPost) => {
    setBusyId(post.id);
    setError(null);
    try {
      const nextStatus: ApiSocialPostStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await updateSocialPost(post.id, { status: nextStatus });
      await onRefresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (post: ApiAdminSocialPost) => {
    if (!window.confirm("Archive this social post? It will be removed from the homepage.")) return;
    setBusyId(post.id);
    setError(null);
    try {
      await archiveSocialPost(post.id);
      await onRefresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= posts.length) return;

    const reordered = [...posts];
    const [moved] = reordered.splice(currentIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    setBusyId(moved.id);
    setError(null);
    try {
      await reorderSocialPosts(reordered.map((p) => p.id));
      await onRefresh();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <InlineError message={error} />

      {/* Mobile stacked cards (< md) */}
      <div className="mt-3 space-y-3 md:hidden">
        {posts.map((post, index) => {
          const isReel =
            post.mediaType === "VIDEO" ||
            post.postUrl.toLowerCase().includes("/reel/") ||
            post.postUrl.toLowerCase().includes("/reels/");

          return (
            <div
              key={post.id}
              className="rounded-lg border border-border/70 bg-surface/50 p-4 space-y-3 shadow-xs"
            >
              {/* Top row: Type, Platform, Status */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-border/60 bg-surface px-2 py-0.5 font-display text-[0.68rem] uppercase tracking-wider text-foreground">
                    {isReel ? (
                      <>
                        <VideoIcon className="size-3 text-primary" aria-hidden />
                        <span>Reel</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-3 text-muted-foreground" aria-hidden />
                        <span>Post</span>
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 font-display text-xs uppercase tracking-wider text-muted-foreground">
                    <Instagram className="size-3 text-primary" aria-hidden />
                    {post.platform}
                  </span>
                </div>
                <ProductStatusBadge status={post.status} />
              </div>

              {/* Caption (if present) */}
              {post.caption ? (
                <p className="text-sm font-medium text-foreground">{post.caption}</p>
              ) : null}

              {/* Post URL */}
              <div className="font-mono text-xs break-all">
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <span className="line-clamp-1">{post.postUrl}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </a>
              </div>

              {/* Order and updated timestamp */}
              <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="text-[0.7rem] uppercase tracking-wider">Order:</span>
                  <button
                    type="button"
                    onClick={() => void move(index, "up")}
                    disabled={disabled || index === 0 || busyId !== null}
                    aria-label="Move up"
                    className="flex size-7 items-center justify-center rounded border border-border/60 bg-surface text-muted-foreground hover:bg-muted active:scale-95 disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <span className="min-w-6 text-center tabular-nums font-mono font-semibold text-foreground">
                    {post.sortOrder}
                  </span>
                  <button
                    type="button"
                    onClick={() => void move(index, "down")}
                    disabled={disabled || index === posts.length - 1 || busyId !== null}
                    aria-label="Move down"
                    className="flex size-7 items-center justify-center rounded border border-border/60 bg-surface text-muted-foreground hover:bg-muted active:scale-95 disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <span className="text-[0.72rem]">{dateTime.format(new Date(post.updatedAt))}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 justify-center"
                  onClick={() => void toggleStatus(post)}
                  disabled={disabled || busyId !== null}
                >
                  {busyId === post.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  ) : post.status === "PUBLISHED" ? (
                    <>
                      <EyeOff className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">Publish</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 justify-center"
                  onClick={() => onEdit(post)}
                  disabled={disabled}
                >
                  <Pencil className="size-3.5 shrink-0" aria-hidden />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void remove(post)}
                  disabled={disabled || busyId !== null || post.status === "ARCHIVED"}
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  <span>Archive</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className={`${tableClasses.wrapper} mt-2 hidden md:block`}>
        <table className={tableClasses.table}>
          <thead className={tableClasses.head}>
            <tr>
              <th scope="col" className={tableClasses.th}>
                Type
              </th>
              <th scope="col" className={tableClasses.th}>
                Platform
              </th>
              <th scope="col" className={tableClasses.th}>
                Instagram URL
              </th>
              <th scope="col" className={tableClasses.th}>
                Label / Caption
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
            {posts.map((post, index) => {
              const isReel =
                post.mediaType === "VIDEO" ||
                post.postUrl.toLowerCase().includes("/reel/") ||
                post.postUrl.toLowerCase().includes("/reels/");

              return (
                <tr key={post.id} className={tableClasses.row}>
                  {/* Media Type */}
                  <td className={tableClasses.td}>
                    <span className="inline-flex items-center gap-1.5 rounded border border-border/60 bg-surface px-2 py-0.5 font-display text-[0.68rem] uppercase tracking-wider text-foreground">
                      {isReel ? (
                        <>
                          <VideoIcon className="size-3 text-primary" aria-hidden />
                          <span>Reel</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-3 text-muted-foreground" aria-hidden />
                          <span>Post</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Platform */}
                  <td className={tableClasses.td}>
                    <span className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-muted-foreground">
                      <Instagram className="size-3.5 text-primary" aria-hidden />
                      {post.platform}
                    </span>
                  </td>

                  {/* Destination URL */}
                  <td className={`${tableClasses.td} max-w-sm truncate font-mono text-xs`}>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      title={post.postUrl}
                    >
                      <span className="truncate">{post.postUrl}</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  </td>

                  {/* Optional Label / Caption */}
                  <td className={`${tableClasses.td} max-w-xs truncate text-muted-foreground`}>
                    {post.caption || "—"}
                  </td>

                  {/* Status */}
                  <td className={tableClasses.td}>
                    <ProductStatusBadge status={post.status} />
                  </td>

                  {/* Order & Reorder arrows */}
                  <td className={`${tableClasses.td} text-center`}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => void move(index, "up")}
                        disabled={disabled || index === 0 || busyId !== null}
                        aria-label="Move up"
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <span className="tabular-nums font-mono text-xs">{post.sortOrder}</span>
                      <button
                        type="button"
                        onClick={() => void move(index, "down")}
                        disabled={disabled || index === posts.length - 1 || busyId !== null}
                        aria-label="Move down"
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Updated date */}
                  <td className={`${tableClasses.td} text-xs text-muted-foreground`}>
                    {dateTime.format(new Date(post.updatedAt))}
                  </td>

                  {/* Actions */}
                  <td className={tableClasses.td}>
                    <div className="flex justify-end gap-1.5">
                      {/* Toggle publish/unpublish */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void toggleStatus(post)}
                        disabled={disabled || busyId !== null}
                        aria-label={post.status === "PUBLISHED" ? "Unpublish post" : "Publish post"}
                        title={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      >
                        {busyId === post.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                        ) : post.status === "PUBLISHED" ? (
                          <EyeOff className="size-3.5" aria-hidden />
                        ) : (
                          <Eye className="size-3.5" aria-hidden />
                        )}
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(post)}
                        disabled={disabled}
                        aria-label="Edit post"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>

                      {/* Archive */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void remove(post)}
                        disabled={disabled || busyId !== null || post.status === "ARCHIVED"}
                        aria-label="Archive post"
                        title="Archive post"
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
  );
}

function SocialPostForm({
  post,
  nextSortOrder,
  onDone,
  onCancel,
}: {
  post: ApiAdminSocialPost | null;
  nextSortOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const urlId = useId();
  const captionId = useId();
  const statusId = useId();
  const orderId = useId();

  const [postUrl, setPostUrl] = useState(post?.postUrl ?? "");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [status, setStatus] = useState<ApiSocialPostStatus>(post?.status ?? "PUBLISHED");
  const [sortOrder, setSortOrder] = useState(String(post?.sortOrder ?? nextSortOrder));

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReel =
    postUrl.toLowerCase().includes("/reel/") || postUrl.toLowerCase().includes("/reels/");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanUrl = postUrl.trim();
    if (!cleanUrl) return setError("Instagram URL is required.");

    if (!isValidInstagramUrl(cleanUrl)) {
      return setError(
        "Please enter a valid Instagram post or reel URL (e.g. https://www.instagram.com/reel/... or https://www.instagram.com/p/...).",
      );
    }

    const order = Number(sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      return setError("Display order must be a non-negative whole number.");
    }

    setPending(true);
    setError(null);

    const input = {
      postUrl: cleanUrl,
      platform: "INSTAGRAM" as const,
      caption: caption.trim() || null,
      status,
      sortOrder: order,
    };

    try {
      if (post) {
        await updateSocialPost(post.id, input);
      } else {
        await createSocialPost(input);
      }
      onDone();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <InlineError message={error} />

      <div className="rounded-md border border-border/80 bg-surface/40 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Platform Display */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Platform</label>
            <div className="inline-flex h-11 w-full items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm text-foreground">
              <Instagram className="size-4 text-primary" aria-hidden />
              <span>Instagram</span>
              {cleanUrlHasType(postUrl) && (
                <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 font-display text-[0.65rem] uppercase tracking-wider text-primary">
                  {isReel ? "Reel" : "Post"}
                </span>
              )}
            </div>
          </div>

          {/* Instagram Post URL */}
          <Field
            id={urlId}
            label="Instagram URL *"
            hint="Supports https://www.instagram.com/reel/... or /p/..."
          >
            <TextInput
              id={urlId}
              type="url"
              required
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {/* Status */}
          <Field id={statusId} label="Status">
            <SelectInput
              id={statusId}
              value={status}
              onChange={(e) => setStatus(e.target.value as ApiSocialPostStatus)}
            >
              <option value="PUBLISHED">Published (Visible on homepage)</option>
              <option value="DRAFT">Draft (Admin only)</option>
              <option value="ARCHIVED">Archived (Hidden)</option>
            </SelectInput>
          </Field>

          {/* Display Order */}
          <Field id={orderId} label="Display Order" hint="Position in feed (0, 1, 2...)">
            <TextInput
              id={orderId}
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </Field>

          {/* Optional Label / Caption */}
          <Field id={captionId} label="Custom Label (Optional)" hint="Optional label or note">
            <TextInput
              id={captionId}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Spiti Valley Ride Reel"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto min-h-10"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto min-h-10" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Saving...
            </>
          ) : post ? (
            "Update post"
          ) : (
            "Save post"
          )}
        </Button>
      </div>
    </form>
  );
}

function cleanUrlHasType(url: string): boolean {
  return url.toLowerCase().includes("/reel/") || url.toLowerCase().includes("/p/");
}
