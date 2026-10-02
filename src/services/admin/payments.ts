/** Admin CMS: UPI payment details and the review of payment proofs. Returns API shapes. */

import { getApiClient } from "@/lib/api";
import type { ApiAdminPayment, ApiAdminPaymentSettings } from "@/lib/api";

const api = () => getApiClient();

export type AdminPaymentFilter = "pending" | "reviewed" | "all";

export type PaymentSettingsInput = {
  upiId: string | null;
  payeeName: string | null;
  instructions: string | null;
  qrMediaId: string | null;
};

export const getPaymentSettings = () =>
  api().request<ApiAdminPaymentSettings>("/admin/payment-settings");
export const updatePaymentSettings = (input: PaymentSettingsInput) =>
  api().request<ApiAdminPaymentSettings>("/admin/payment-settings", {
    method: "PATCH",
    body: input,
  });

export const listAdminPayments = (status: AdminPaymentFilter) =>
  api().request<ApiAdminPayment[]>("/admin/payments", { query: { status } });
export const approvePayment = (id: string) =>
  api().request<ApiAdminPayment>(`/admin/payments/${id}/approve`, { method: "POST" });
export const rejectPayment = (id: string, reason: string | null) =>
  api().request<ApiAdminPayment>(`/admin/payments/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
