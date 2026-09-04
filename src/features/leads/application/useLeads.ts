import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type {
  LeadEntity,
  LeadFilters,
  LeadItemEntity,
  LeadSummary,
  LeadWithItems,
  UpdateLeadItemInput,
} from "../domain";
import type {
  CreateLeadPayload,
  UpdateLeadPayload,
} from "./services/leadApplicationService";

const leadsKey = ["leads"];
const leadDetailKey = (leadId: number) => [...leadsKey, leadId.toString()];
const leadsStatusKey = (status: string) => [...leadsKey, "status", status];
const leadsSearchKey = (term: string) => [...leadsKey, "search", term];
const leadItemsKey = (leadId: number) => [
  ...leadsKey,
  leadId.toString(),
  "items",
];
const leadSummaryKey = [...leadsKey, "summary"];

export const useLeads = (filters?: LeadFilters) => {
  const { status, search } = filters ?? {};
  const trimmedSearch = search?.trim() ?? "";

  const key =
    trimmedSearch.length > 0
      ? leadsSearchKey(trimmedSearch)
      : status
        ? leadsStatusKey(status)
        : leadsKey;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (trimmedSearch) params.set("search", trimmedSearch);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useStandardQuery(
    key,
    () =>
      apiFetch<{ leads: LeadEntity[] }>(`/api/leads${qs}`).then((d) => d.leads),
    {
      enabled: !trimmedSearch || trimmedSearch.length > 1,
      staleTime: 60 * 1000,
    }
  );
};

export const useLead = (leadId: number) => {
  return useStandardQuery(
    leadDetailKey(leadId),
    () => apiFetch<LeadWithItems>(`/api/leads/${leadId}`),
    {
      enabled: leadId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useLeadItems = (leadId: number) => {
  return useStandardQuery(
    leadItemsKey(leadId),
    () =>
      apiFetch<{ items: LeadItemEntity[] }>(`/api/leads/${leadId}/items`).then(
        (d) => d.items
      ),
    {
      enabled: leadId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useLeadSummary = () => {
  return useStandardQuery(
    leadSummaryKey,
    () => apiFetch<LeadSummary>("/api/leads/summary"),
    {
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateLead = () => {
  return useStandardMutation(
    (payload: CreateLeadPayload) =>
      apiFetch<LeadWithItems>("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    {
      invalidateQueries: [leadsKey, leadSummaryKey],
      successMessage: "Lead created successfully",
      errorMessage: "Failed to create lead",
    }
  );
};

export const useUpdateLead = () => {
  return useStandardMutation(
    ({
      leadId,
      payload,
    }: {
      leadId: number;
      payload: UpdateLeadPayload;
    }) =>
      apiFetch<LeadWithItems>(`/api/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    {
      invalidateQueries: [leadsKey],
      successMessage: "Lead updated successfully",
      errorMessage: "Failed to update lead",
    }
  );
};

export const useReplaceLeadItems = () => {
  return useStandardMutation(
    ({
      leadId,
      items,
    }: {
      leadId: number;
      items: UpdateLeadItemInput[];
    }) =>
      apiFetch<{ items: LeadItemEntity[] }>(`/api/leads/${leadId}/items`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      }).then((d) => d.items),
    {
      invalidateQueries: [leadsKey],
      successMessage: "Lead items updated",
      errorMessage: "Failed to update lead items",
    }
  );
};

export const useDeleteLead = () => {
  return useStandardMutation(
    (leadId: number) =>
      apiFetch<{ success: boolean }>(`/api/leads/${leadId}`, {
        method: "DELETE",
      }),
    {
      invalidateQueries: [leadsKey, leadSummaryKey],
      successMessage: "Lead deleted",
      errorMessage: "Failed to delete lead",
    }
  );
};
