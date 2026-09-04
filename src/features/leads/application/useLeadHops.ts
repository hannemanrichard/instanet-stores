import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type {
  CreateLeadHopInput,
  LeadHopEntity,
  UpdateLeadHopInput,
} from "../domain";

const leadHopsKey = ["lead-hops"];
const leadHopsByLeadKey = (leadId: number) => [
  ...leadHopsKey,
  "lead",
  leadId.toString(),
];
const leadHopsByAgentKey = (agentId: number) => [
  ...leadHopsKey,
  "agent",
  agentId.toString(),
];
const leadHopKey = (leadId: number, agentId: number) => [
  ...leadHopsKey,
  leadId.toString(),
  agentId.toString(),
];

export const useLeadHops = () => {
  return useStandardQuery(
    leadHopsKey,
    () =>
      apiFetch<{ hops: LeadHopEntity[] }>("/api/lead-hops").then((d) => d.hops),
    {
      staleTime: 60 * 1000,
    }
  );
};

export const useLeadHopsByLeadId = (leadId: number) => {
  return useStandardQuery(
    leadHopsByLeadKey(leadId),
    () =>
      apiFetch<{ hops: LeadHopEntity[] }>(
        `/api/lead-hops?leadId=${leadId}`
      ).then((d) => d.hops),
    {
      enabled: leadId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useLeadHopsByAgentId = (agentId: number) => {
  return useStandardQuery(
    leadHopsByAgentKey(agentId),
    () =>
      apiFetch<{ hops: LeadHopEntity[] }>(
        `/api/lead-hops?agentId=${agentId}`
      ).then((d) => d.hops),
    {
      enabled: agentId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useLeadHop = (leadId: number, agentId: number) => {
  return useStandardQuery(
    leadHopKey(leadId, agentId),
    () =>
      apiFetch<{ hop: LeadHopEntity | null }>(
        `/api/lead-hops?leadId=${leadId}&agentId=${agentId}`
      ).then((d) => d.hop),
    {
      enabled: leadId > 0 && agentId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useCreateLeadHop = () => {
  return useStandardMutation(
    (data: CreateLeadHopInput) =>
      apiFetch<{ hop: LeadHopEntity }>("/api/lead-hops", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((d) => d.hop),
    {
      invalidateQueries: [leadHopsKey],
      successMessage: "Lead hop created successfully",
      errorMessage: "Failed to create lead hop",
    }
  );
};

export const useUpdateLeadHop = () => {
  return useStandardMutation(
    ({
      leadId,
      agentId,
      data,
    }: {
      leadId: number;
      agentId: number;
      data: UpdateLeadHopInput;
    }) =>
      apiFetch<{ hop: LeadHopEntity }>(
        `/api/lead-hops/${leadId}/${agentId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ).then((d) => d.hop),
    {
      invalidateQueries: [leadHopsKey],
      successMessage: "Lead hop updated successfully",
      errorMessage: "Failed to update lead hop",
    }
  );
};

export const useDeleteLeadHop = () => {
  return useStandardMutation(
    ({ leadId, agentId }: { leadId: number; agentId: number }) =>
      apiFetch<{ success: boolean }>(`/api/lead-hops/${leadId}/${agentId}`, {
        method: "DELETE",
      }),
    {
      invalidateQueries: [leadHopsKey],
      successMessage: "Lead hop deleted",
      errorMessage: "Failed to delete lead hop",
    }
  );
};

export const useDeleteLeadHopsByLeadId = () => {
  return useStandardMutation(
    (leadId: number) =>
      apiFetch<{ success: boolean }>(`/api/lead-hops/by-lead/${leadId}`, {
        method: "DELETE",
      }),
    {
      invalidateQueries: [leadHopsKey],
      successMessage: "Lead hops deleted",
      errorMessage: "Failed to delete lead hops",
    }
  );
};
