import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import {
  useCreateLead,
  useDeleteLead,
  useLead,
  useLeadItems,
  useLeadSummary,
  useLeads,
  useReplaceLeadItems,
  useUpdateLead,
} from "../../application/useLeads";
import { apiFetch } from "@/shared/utils/apiFetch";

jest.mock("@/shared/utils/apiFetch");
jest.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("Lead hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches leads", async () => {
    mockApiFetch.mockResolvedValue({ leads: [{ id: 1 }] });

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads");
  });

  it("fetches lead detail", async () => {
    mockApiFetch.mockResolvedValue({ lead: { id: 1 }, items: [] });

    const { result } = renderHook(() => useLead(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/1");
  });

  it("fetches lead items", async () => {
    mockApiFetch.mockResolvedValue({ items: [{ id: 1 }] });

    const { result } = renderHook(() => useLeadItems(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/1/items");
  });

  it("fetches lead summary", async () => {
    mockApiFetch.mockResolvedValue({ total: 10 });

    const { result } = renderHook(() => useLeadSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/summary");
  });

  it("creates lead via mutation", async () => {
    mockApiFetch.mockResolvedValue({ lead: { id: 1 }, items: [] });

    const { result } = renderHook(() => useCreateLead(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      lead: { customer_name: "A", customer_phone: "1" } as any,
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads", {
      method: "POST",
      body: expect.any(String),
    });
  });

  it("updates lead via mutation", async () => {
    mockApiFetch.mockResolvedValue({ lead: { id: 1 }, items: [] });

    const { result } = renderHook(() => useUpdateLead(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      leadId: 1,
      payload: { lead: { status: "confirmed" } },
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/1", {
      method: "PATCH",
      body: JSON.stringify({ lead: { status: "confirmed" } }),
    });
  });

  it("replaces lead items via mutation", async () => {
    mockApiFetch.mockResolvedValue({ items: [{ id: 1, qty: 2 }] });

    const { result } = renderHook(() => useReplaceLeadItems(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      leadId: 1,
      items: [{ id: 1, qty: 2 }] as any,
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/1/items", {
      method: "PUT",
      body: JSON.stringify({ items: [{ id: 1, qty: 2 }] }),
    });
  });

  it("deletes lead via mutation", async () => {
    mockApiFetch.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteLead(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(1);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/leads/1", {
      method: "DELETE",
    });
  });
});
