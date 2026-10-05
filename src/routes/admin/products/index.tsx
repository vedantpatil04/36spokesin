import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, Copy, ImageOff, PackageSearch, Pencil, Plus, RotateCcw } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { dateTime, tableClasses } from "@/components/admin/admin-format";
import { AdminPageHeader, InlineError, ProductStatusBadge } from "@/components/admin/admin-ui";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Button, ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiAdminProductListItem, ApiProductStatus } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/format";
import { minorToRupees } from "@/lib/money";
import { describeError } from "@/services/request-helpers";
import {
  type AdminProductSort,
  archiveProduct,
  duplicateProduct,
  listAdminCategories,
  listAdminProducts,
  updateProduct,
} from "@/services/admin/catalog";

const STATUSES: ApiProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const SORTS: { value: AdminProductSort; label: string }[] = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Newest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "stock_asc", label: "Stock, lowest first" },
];

type Search = {
  q?: string;
  status?: ApiProductStatus;
  categoryId?: string;
  sort?: AdminProductSort;
};

export const Route = createFileRoute("/admin/products/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {}),
    ...(STATUSES.includes(search["status"] as ApiProductStatus)
      ? { status: search["status"] as ApiProductStatus }
      : {}),
    ...(typeof search["categoryId"] === "string" && search["categoryId"]
      ? { categoryId: search["categoryId"] }
      : {}),
    ...(SORTS.some((sort) => sort.value === search["sort"])
      ? { sort: search["sort"] as AdminProductSort }
      : {}),
  }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const refresh = useCatalogRefresh();
  // A stack of cursors: the last entry is the current page.
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const cursor = cursors.at(-1) ?? null;
  const [query, setQuery] = useState(search.q ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => setCursors([null]), [search.q, search.status, search.categoryId, search.sort]);
  useEffect(() => setQuery(search.q ?? ""), [search.q]);

  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: listAdminCategories });
  const products = useQuery({
    queryKey: ["admin", "products", search, cursor],
    queryFn: () => listAdminProducts({ ...search, cursor }),
    placeholderData: keepPreviousData,
  });

  const setSearch = (patch: { [K in keyof Search]?: Search[K] | undefined }) =>
    void navigate({
      search: (previous) => {
        const next: Record<string, unknown> = { ...previous, ...patch };
        for (const key of Object.keys(next)) if (!next[key]) delete next[key];
        return next as Search;
      },
    });

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch({ q: query.trim() || undefined });
  };

  const runRowAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      await refresh(["admin", "products"]);
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setBusyId(null);
    }
  };

  const rows = products.data?.items ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Everything in the shop. Only published products are visible to riders."
        actions={
          <ButtonLink to="/admin/products/new">
            <Plus className="size-4" aria-hidden />
            New product
          </ButtonLink>
        }
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_12rem_12rem]">
        <form onSubmit={submitSearch} role="search" className="flex gap-2">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <TextInput
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SKU or slug"
            className="mt-0 h-11"
          />
          <Button type="submit" variant="outline" className="h-11">
            Search
          </Button>
        </form>
        <SelectInput
          aria-label="Status"
          value={search.status ?? ""}
          onChange={(event) =>
            setSearch({ status: (event.target.value || undefined) as ApiProductStatus | undefined })
          }
          className="mt-0 h-11"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          aria-label="Category"
          value={search.categoryId ?? ""}
          onChange={(event) => setSearch({ categoryId: event.target.value || undefined })}
          className="mt-0 h-11"
        >
          <option value="">All categories</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          aria-label="Sort"
          value={search.sort ?? "updated_desc"}
          onChange={(event) => setSearch({ sort: event.target.value as AdminProductSort })}
          className="mt-0 h-11"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </SelectInput>
      </div>

      <InlineError message={actionError} />

      {products.isPending ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : products.isError ? (
        <ErrorState
          title="Products didn't load"
          description={describeError(products.error)}
          onRetry={() => void products.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={
            search.q || search.status || search.categoryId ? "No products match" : "No products yet"
          }
          description={
            search.q || search.status || search.categoryId
              ? "Try a different search or clear the filters."
              : "Create your first product to start the shop."
          }
          action={
            <ButtonLink to="/admin/products/new" variant="outline">
              New product
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* Mobile Stacked Product Cards (< md) */}
          <div className="space-y-3 md:hidden" aria-busy={products.isFetching}>
            {rows.map((product) => (
              <article
                key={product.id}
                className="rounded-sm border border-border bg-card p-3.5 transition-colors"
                aria-busy={busyId === product.id}
              >
                <div className="flex items-start gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
                    {product.primaryImage?.url ? (
                      <img
                        src={product.primaryImage.url}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="flex size-full items-center justify-center text-muted-foreground"
                        title="No images"
                      >
                        <ImageOff className="size-5" aria-hidden />
                        <span className="sr-only">No images</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/admin/products/$productId"
                        params={{ productId: product.id }}
                        className="font-semibold text-foreground hover:text-primary line-clamp-2 leading-snug"
                      >
                        {product.name}
                      </Link>
                      <ProductStatusBadge status={product.status} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {product.sku} · {product.category.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground text-sm">
                        {formatINR(minorToRupees(product.price))}
                      </span>
                      <span className="text-muted-foreground">
                        Stock: <span className="font-medium text-foreground">{formatNumber(product.stockQuantity)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                  <span className="text-[0.65rem] text-muted-foreground">
                    {dateTime.format(new Date(product.updatedAt))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/admin/products/$productId"
                      params={{ productId: product.id }}
                      className="inline-flex h-9 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-surface-2 active:bg-surface-2"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void runRowAction(product.id, async () => {
                          const copy = await duplicateProduct(product.id);
                          await navigate({
                            to: "/admin/products/$productId",
                            params: { productId: copy.id },
                          });
                        })
                      }
                      className="flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-40"
                      aria-label={`Duplicate ${product.name}`}
                      title="Duplicate"
                    >
                      <Copy className="size-3.5" aria-hidden />
                    </button>
                    {product.status === "ARCHIVED" ? (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() =>
                          void runRowAction(product.id, () =>
                            updateProduct(product.id, { status: "DRAFT" }),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-40"
                        aria-label={`Restore ${product.name}`}
                        title="Restore"
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Archive “${product.name}”? It leaves the shop but keeps its history.`,
                            )
                          ) {
                            void runRowAction(product.id, () => archiveProduct(product.id));
                          }
                        }}
                        className="flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:text-destructive active:bg-surface-2 disabled:opacity-40"
                        aria-label={`Archive ${product.name}`}
                        title="Archive"
                      >
                        <Archive className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className={`${tableClasses.wrapper} hidden md:block`} aria-busy={products.isFetching}>
            <table className={tableClasses.table}>
              <thead className={tableClasses.head}>
                <tr>
                  <th scope="col" className={tableClasses.th}>
                    <span className="sr-only">Image</span>
                  </th>
                  <th scope="col" className={tableClasses.th}>
                    Product
                  </th>
                  <th scope="col" className={tableClasses.th}>
                    Category
                  </th>
                  <th scope="col" className={`${tableClasses.th} text-right`}>
                    Price
                  </th>
                  <th scope="col" className={`${tableClasses.th} text-right`}>
                    Stock
                  </th>
                  <th scope="col" className={tableClasses.th}>
                    Status
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
                {rows.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    busy={busyId === product.id}
                    disabled={busyId !== null}
                    onDuplicate={() =>
                      void runRowAction(product.id, async () => {
                        const copy = await duplicateProduct(product.id);
                        await navigate({
                          to: "/admin/products/$productId",
                          params: { productId: copy.id },
                        });
                      })
                    }
                    onArchive={() => {
                      if (
                        window.confirm(
                          `Archive “${product.name}”? It leaves the shop but keeps its history.`,
                        )
                      ) {
                        void runRowAction(product.id, () => archiveProduct(product.id));
                      }
                    }}
                    onRestore={() =>
                      void runRowAction(product.id, () =>
                        updateProduct(product.id, { status: "DRAFT" }),
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {cursors.length > 1 || products.data?.meta.nextCursor ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={cursors.length <= 1 || products.isFetching}
            onClick={() => setCursors((stack) => stack.slice(0, -1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {cursors.length}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!products.data?.meta.nextCursor || products.isFetching}
            onClick={() => {
              const next = products.data?.meta.nextCursor;
              if (next) setCursors((stack) => [...stack, next]);
            }}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

function ProductRow({
  product,
  busy,
  disabled,
  onDuplicate,
  onArchive,
  onRestore,
}: {
  product: ApiAdminProductListItem;
  busy: boolean;
  disabled: boolean;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const thumb = product.primaryImage?.url;
  const iconButton =
    "flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <tr className={tableClasses.row} aria-busy={busy}>
      <td className={`${tableClasses.td} w-16`}>
        <div className="size-12 overflow-hidden rounded-sm border border-border bg-surface">
          {thumb ? (
            <img src={thumb} alt="" className="size-full object-cover" loading="lazy" />
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
        <Link
          to="/admin/products/$productId"
          params={{ productId: product.id }}
          className="font-semibold text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.sku}</p>
      </td>
      <td className={`${tableClasses.td} text-muted-foreground`}>{product.category.name}</td>
      <td className={`${tableClasses.td} text-right tabular-nums`}>
        {formatINR(minorToRupees(product.price))}
      </td>
      <td className={`${tableClasses.td} text-right tabular-nums`}>
        {formatNumber(product.stockQuantity)}
        {product.stockStatus !== "IN_STOCK" ? (
          <span className="block text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
            {product.stockStatus.replace(/_/g, " ").toLowerCase()}
          </span>
        ) : null}
      </td>
      <td className={tableClasses.td}>
        <ProductStatusBadge status={product.status} />
      </td>
      <td className={`${tableClasses.td} whitespace-nowrap text-xs text-muted-foreground`}>
        {dateTime.format(new Date(product.updatedAt))}
      </td>
      <td className={tableClasses.td}>
        <div className="flex justify-end gap-1.5">
          <Link
            to="/admin/products/$productId"
            params={{ productId: product.id }}
            className={iconButton}
            aria-label={`Edit ${product.name}`}
            title="Edit"
          >
            <Pencil className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            className={iconButton}
            onClick={onDuplicate}
            disabled={disabled}
            aria-label={`Duplicate ${product.name}`}
            title="Duplicate"
          >
            <Copy className="size-4" aria-hidden />
          </button>
          {product.status === "ARCHIVED" ? (
            <button
              type="button"
              className={iconButton}
              onClick={onRestore}
              disabled={disabled}
              aria-label={`Restore ${product.name} as a draft`}
              title="Restore as draft"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className={iconButton}
              onClick={onArchive}
              disabled={disabled}
              aria-label={`Archive ${product.name}`}
              title="Archive"
            >
              <Archive className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
