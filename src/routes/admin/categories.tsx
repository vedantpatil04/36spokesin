import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { type ImageChoice, SingleImageField } from "@/components/admin/SingleImageField";
import { tableClasses } from "@/components/admin/admin-format";
import { AdminPageHeader, AdminPanel, Field, InlineError } from "@/components/admin/admin-ui";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, TextInput } from "@/components/ui-kit";
import type { ApiBrand, ApiCategory } from "@/lib/api";
import {
  createBrand,
  createCategory,
  deleteBrand,
  deleteCategory,
  listAdminCategories,
  listBrands,
  updateBrand,
  updateCategory,
} from "@/services/admin/catalog";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: listAdminCategories });
  const brands = useQuery({ queryKey: ["admin", "brands"], queryFn: listBrands });
  const [editing, setEditing] = useState<ApiCategory | "new" | null>(null);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories & brands"
        description="Categories group the shop by what gear does on a ride. Brands are optional labels on products."
      />

      <AdminPanel
        title="Categories"
        actions={
          <Button size="sm" onClick={() => setEditing("new")} disabled={editing !== null}>
            <Plus className="size-3.5" aria-hidden />
            New category
          </Button>
        }
      >
        {editing ? (
          <div className="mb-6 rounded-sm border border-border p-4">
            <CategoryForm
              key={editing === "new" ? "new" : editing.id}
              category={editing === "new" ? null : editing}
              nextSortOrder={categories.data?.length ?? 0}
              onDone={() => setEditing(null)}
            />
          </div>
        ) : null}
        {categories.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : categories.isError ? (
          <ErrorState title="Categories didn't load" onRetry={() => void categories.refetch()} />
        ) : categories.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <CategoryTable
            categories={categories.data}
            onEdit={setEditing}
            disabled={editing !== null}
          />
        )}
      </AdminPanel>

      <AdminPanel title="Brands" description="Delete is only possible for brands no product uses.">
        {brands.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : brands.isError ? (
          <ErrorState title="Brands didn't load" onRetry={() => void brands.refetch()} />
        ) : (
          <BrandManager brands={brands.data} />
        )}
      </AdminPanel>
    </div>
  );
}

function CategoryTable({
  categories,
  onEdit,
  disabled,
}: {
  categories: ApiCategory[];
  onEdit: (category: ApiCategory) => void;
  disabled: boolean;
}) {
  const refresh = useCatalogRefresh();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (category: ApiCategory) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    setBusyId(category.id);
    setError(null);
    try {
      await deleteCategory(category.id);
      await refresh(["admin", "categories"]);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <InlineError message={error} />

      {/* Mobile Stacked Category Cards (< md) */}
      <div className="space-y-3 mt-2 md:hidden">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-sm border border-border bg-card p-3.5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
                {category.image?.url ? (
                  <img src={category.image.url} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    None
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground leading-snug">{category.name}</h4>
                  <span className="font-mono text-xs text-muted-foreground">#{category.sortOrder}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{category.slug}</p>
                {category.description ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
              <span className="text-muted-foreground">
                Products: <span className="font-medium text-foreground">{category.productCount}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => onEdit(category)}
                  disabled={disabled}
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="size-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => void remove(category)}
                  disabled={disabled || busyId !== null || category.productCount > 0}
                  aria-label={`Delete ${category.name}`}
                  title={
                    category.productCount > 0
                      ? "Move its products to another category first"
                      : "Delete"
                  }
                >
                  {busyId === category.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden />
                  )}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className={`${tableClasses.wrapper} mt-2 hidden md:block`}>
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
                Slug
              </th>
              <th scope="col" className={tableClasses.th}>
                Description
              </th>
              <th scope="col" className={`${tableClasses.th} text-right`}>
                Order
              </th>
              <th scope="col" className={`${tableClasses.th} text-right`}>
                Products
              </th>
              <th scope="col" className={`${tableClasses.th} text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className={tableClasses.row}>
                <td className={`${tableClasses.td} w-14`}>
                  <div className="size-10 overflow-hidden rounded-sm border border-border bg-surface">
                    {category.image?.url ? (
                      <img src={category.image.url} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                </td>
                <td className={`${tableClasses.td} font-semibold`}>{category.name}</td>
                <td className={`${tableClasses.td} font-mono text-xs text-muted-foreground`}>
                  {category.slug}
                </td>
                <td className={`${tableClasses.td} text-muted-foreground`}>
                  {category.description}
                </td>
                <td className={`${tableClasses.td} text-right tabular-nums`}>
                  {category.sortOrder}
                </td>
                <td className={`${tableClasses.td} text-right tabular-nums`}>
                  {category.productCount}
                </td>
                <td className={tableClasses.td}>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(category)}
                      disabled={disabled}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void remove(category)}
                      disabled={disabled || busyId !== null || category.productCount > 0}
                      aria-label={`Delete ${category.name}`}
                      title={
                        category.productCount > 0
                          ? "Move its products to another category first"
                          : "Delete"
                      }
                    >
                      {busyId === category.id ? (
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CategoryForm({
  category,
  nextSortOrder,
  onDone,
}: {
  category: ApiCategory | null;
  nextSortOrder: number;
  onDone: () => void;
}) {
  const id = useId();
  const refresh = useCatalogRefresh();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? nextSortOrder));
  const [image, setImage] = useState<ImageChoice>(
    category?.image ? { id: category.image.id, url: category.image.url } : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const order = Number(sortOrder);
    if (name.trim().length < 2) return setError("Enter a category name.");
    if (!Number.isInteger(order) || order < 0) return setError("Order must be a whole number.");
    setPending(true);
    setError(null);
    const input = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim().toLowerCase() } : {}),
      description: description.trim() || null,
      sortOrder: order,
      imageMediaId: image?.id ?? null,
    };
    try {
      if (category) await updateCategory(category.id, input);
      else await createCategory(input);
      await refresh(["admin", "categories"]);
      onDone();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="grid gap-4 md:grid-cols-2">
      <Field id={`${id}-name`} label="Name">
        <TextInput
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          required
        />
      </Field>
      <Field
        id={`${id}-slug`}
        label="URL slug"
        hint={category ? "Changing it changes /shop/… links." : "Leave empty to generate it."}
      >
        <TextInput
          id={`${id}-slug`}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="font-mono"
          maxLength={120}
        />
      </Field>
      <Field id={`${id}-description`} label="Description" hint="e.g. Helmets, armour, guards">
        <TextInput
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={200}
        />
      </Field>
      <Field id={`${id}-order`} label="Order" hint="Lower numbers are listed first.">
        <TextInput
          id={`${id}-order`}
          inputMode="numeric"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <SingleImageField
          label="Image"
          category="PRODUCT"
          value={image}
          onChange={setImage}
          disabled={pending}
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 md:col-span-2">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {category ? "Save category" : "Create category"}
        </Button>
        <InlineError message={error} />
      </div>
    </form>
  );
}

function BrandManager({ brands }: { brands: ApiBrand[] }) {
  const id = useId();
  const refresh = useCatalogRefresh();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setPending(true);
    setError(null);
    try {
      await action();
      await refresh(["admin", "brands"]);
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col sm:flex-row sm:items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void run(() => createBrand({ name: name.trim() })).then((ok) => ok && setName(""));
        }}
      >
        <div className="w-full sm:min-w-56 sm:flex-1">
          <label htmlFor={`${id}-brand`} className="sr-only">
            New brand name
          </label>
          <TextInput
            id={`${id}-brand`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New brand name"
            maxLength={80}
            className="mt-0 h-11"
          />
        </div>
        <Button type="submit" variant="outline" className="w-full sm:w-auto" disabled={pending || !name.trim()}>
          Add brand
        </Button>
      </form>
      <InlineError message={error} />
      {brands.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brands yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border">
          {brands.map((brand) => (
            <li key={brand.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              {renaming?.id === brand.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(() => updateBrand(brand.id, { name: renaming.name.trim() })).then(
                      (ok) => ok && setRenaming(null),
                    );
                  }}
                >
                  <label htmlFor={`${id}-rename-${brand.id}`} className="sr-only">
                    Brand name
                  </label>
                  <TextInput
                    id={`${id}-rename-${brand.id}`}
                    value={renaming.name}
                    onChange={(event) => setRenaming({ id: brand.id, name: event.target.value })}
                    className="mt-0 h-9"
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={pending}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm">
                    {brand.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenaming({ id: brand.id, name: brand.name })}
                    disabled={pending}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || brand.productCount > 0}
                    onClick={() => {
                      if (window.confirm(`Delete the brand “${brand.name}”?`))
                        void run(() => deleteBrand(brand.id));
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
