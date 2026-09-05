const insertMock = jest.fn();

jest.mock("@/infrastructure/supabase/server", () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      insert: insertMock,
    })),
  },
}));

describe("AuditLogger", () => {
  beforeEach(() => {
    insertMock.mockReset();
  });

  it("injects the project source automatically", async () => {
    insertMock.mockResolvedValue({ error: null });

    const { AuditLogger } = await import("./auditLogger");

    await AuditLogger.logAuditEntry({
      table_name: "orders",
      recordId: 123,
      action: "INSERT",
      new_values: { status: "initial" },
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table_name: "orders",
        source: "instanet-stores",
      })
    );
  });
});
