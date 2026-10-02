/**
 * Form model for the product editor: API record ⇄ editable strings, plus the
 * client-side checks that mirror the API's validation (the API stays the
 * authority and its field errors are shown too).
 */
import type { ApiAdminProduct, ApiProductStatus, ApiStockStatus } from "@/lib/api";
import { minorToRupees, rupeesToMinor } from "@/lib/money";
import type { ProductInput } from "@/services/admin/catalog";

export type SpecRow = { key: string; groupName: string; label: string; value: string };
export type FitRow = { key: string; bikeModelId: string; bikeVariantId: string; note: string };

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  stockStatus: ApiStockStatus;
  status: ApiProductStatus;
  featured: boolean;
  universalFit: boolean;
  weightGrams: string;
  specifications: SpecRow[];
  compatibility: FitRow[];
};

export type FieldErrors = Record<string, string>;

let rowKey = 0;
export const newRowKey = () => `row-${(rowKey += 1)}`;

export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,63}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function emptyProductValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    sku: "",
    categoryId: "",
    brandId: "",
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "0",
    stockStatus: "IN_STOCK",
    status: "DRAFT",
    featured: false,
    universalFit: false,
    weightGrams: "",
    specifications: [],
    compatibility: [],
  };
}

export function productToValues(product: ApiAdminProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.category.id,
    brandId: product.brand?.id ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: String(minorToRupees(product.price)),
    compareAtPrice:
      product.compareAtPrice !== null ? String(minorToRupees(product.compareAtPrice)) : "",
    stockQuantity: String(product.stockQuantity),
    stockStatus: product.stockStatus,
    status: product.status,
    featured: product.featured,
    universalFit: product.universalFit,
    weightGrams: product.weightGrams !== null ? String(product.weightGrams) : "",
    specifications: product.specifications.map((spec) => ({
      key: newRowKey(),
      groupName: spec.groupName ?? "",
      label: spec.label,
      value: spec.value,
    })),
    compatibility: product.compatibility.map((fit) => ({
      key: newRowKey(),
      bikeModelId: fit.bikeModelId,
      bikeVariantId: fit.bikeVariantId ?? "",
      note: fit.note ?? "",
    })),
  };
}

/** Values without row keys, for "unsaved changes" comparisons. */
export function comparable(values: ProductFormValues): string {
  return JSON.stringify({
    ...values,
    specifications: values.specifications.map(({ key: _key, ...rest }) => rest),
    compatibility: values.compatibility.map(({ key: _key, ...rest }) => rest),
  });
}

const RUPEES = /^\d+(\.\d{1,2})?$/;
const WHOLE = /^\d+$/;

export function valuesToInput(values: ProductFormValues): {
  input: ProductInput | null;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const sku = values.sku.trim().toUpperCase();
  const slug = values.slug.trim().toLowerCase();

  if (name.length < 2) errors["name"] = "Enter a product name.";
  if (!SKU_PATTERN.test(sku))
    errors["sku"] = "2–64 characters: letters, digits, dots, hyphens or underscores.";
  if (slug && !SLUG_PATTERN.test(slug)) errors["slug"] = "Lower-case words separated by hyphens.";
  if (!values.categoryId) errors["categoryId"] = "Choose a category.";

  const price = values.price.trim();
  if (!RUPEES.test(price)) errors["price"] = "Enter a price in rupees, e.g. 8499 or 8499.50.";
  const compareAt = values.compareAtPrice.trim();
  if (compareAt && !RUPEES.test(compareAt)) errors["compareAtPrice"] = "Enter an amount in rupees.";
  if (
    !errors["price"] &&
    compareAt &&
    !errors["compareAtPrice"] &&
    Number(compareAt) <= Number(price)
  ) {
    errors["compareAtPrice"] = "Must be higher than the price.";
  }
  if (!WHOLE.test(values.stockQuantity.trim())) errors["stockQuantity"] = "Enter a whole number.";
  const weight = values.weightGrams.trim();
  if (weight && (!WHOLE.test(weight) || Number(weight) < 1))
    errors["weightGrams"] = "Enter grams as a whole number.";

  const specifications = values.specifications
    .filter((row) => row.label.trim() || row.value.trim() || row.groupName.trim())
    .map((row, index) => {
      if (!row.label.trim() || !row.value.trim()) {
        errors[`specifications.${index}`] = "Each row needs a label and a value.";
      }
      return {
        groupName: row.groupName.trim() || null,
        label: row.label.trim(),
        value: row.value.trim(),
      };
    });

  const compatibility = values.universalFit
    ? []
    : values.compatibility.flatMap((row, index) => {
        if (!row.bikeModelId) {
          errors[`compatibility.${index}.bikeModelId`] = "Choose a bike or remove this row.";
          return [];
        }
        return [
          {
            bikeModelId: row.bikeModelId,
            bikeVariantId: row.bikeVariantId || null,
            note: row.note.trim() || null,
          },
        ];
      });

  if (Object.keys(errors).length > 0) return { input: null, errors };

  return {
    errors,
    input: {
      name,
      ...(slug ? { slug } : {}),
      sku,
      categoryId: values.categoryId,
      brandId: values.brandId || null,
      shortDescription: values.shortDescription.trim() || null,
      description: values.description.trim() || null,
      price: rupeesToMinor(Number(price)),
      compareAtPrice: compareAt ? rupeesToMinor(Number(compareAt)) : null,
      status: values.status,
      featured: values.featured,
      stockQuantity: Number(values.stockQuantity.trim()),
      stockStatus: values.stockStatus,
      weightGrams: weight ? Number(weight) : null,
      universalFit: values.universalFit,
      specifications,
      compatibility,
    },
  };
}
