import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CommsInbox from "./CommsInbox";

// The Inbox is admin-only, so it can't be reached in a browser without a Google
// login. These cover the part that matters: unfiled messages are grouped the way
// they arrived (a WhatsApp export is one chat, not twelve rows), and filing a
// chat files every message in it.

const rpc = vi.fn((_name: string, _args: Record<string, string>) =>
  Promise.resolve({ data: null, error: null }));
let messages: Record<string, unknown>[] = [];
let contacts: Record<string, unknown>[] = [];

// Minimal chainable stand-in for the supabase query builder: every method
// returns itself, and awaiting it resolves to whatever the table holds.
function qb(data: unknown) {
  const p: Record<string, unknown> = {};
  for (const m of ["select", "in", "order", "limit", "eq", "update", "insert", "single", "maybeSingle"]) {
    p[m] = () => p;
  }
  p.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve({ data, error: null, count: Array.isArray(data) ? data.length : 0 }).then(res, rej);
  return p;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => qb(table === "contacts" ? contacts : messages),
    rpc: (name: string, args: Record<string, string>) => rpc(name, args),
    auth: { getUser: () => Promise.resolve({ data: { user: { email: "adam@test" } } }) },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const waMsg = (n: number, body: string, sender: string) => ({
  id: `wa${n}`, channel: "whatsapp", direction: sender === "Jane Smith" ? "in" : "out",
  from_addr: sender, to_addr: null, subject: "WhatsApp with Jane Smith", body,
  occurred_at: `2026-08-31T0${n}:00:00.000Z`, created_by: "inbound",
  source: "whatsapp_export", external_id: `wa_${n}`, status: "unfiled",
  raw: { thread: "Jane Smith", counterparty: "Jane Smith", sender }, attachments: [],
});

beforeEach(() => {
  rpc.mockClear();
  contacts = [
    { id: "c1", email: "jane@example.com", name: "Jane Smith", tags: [], created_at: "2026-01-01T00:00:00Z" },
    { id: "c2", email: "tom@surfclub.org", name: "Tom Blake", tags: [], created_at: "2026-01-02T00:00:00Z" },
  ];
  messages = [
    {
      id: "e1", channel: "email", direction: "in", from_addr: "priya@retail.co.uk", to_addr: null,
      subject: "Wholesale in Cornwall", body: "Could we stock this?",
      occurred_at: "2026-09-01T02:00:00.000Z", created_by: "inbound",
      source: "inbound_email", external_id: "resend_1", status: "unfiled",
      raw: { correspondent_name: "Priya Nair", forwarded: true }, attachments: [],
    },
    waMsg(1, "Hey Adam, got the oil", "Jane Smith"),
    waMsg(2, "How is it going on your hands?", "Adam Hyde"),
    waMsg(3, "Really good.", "Jane Smith"),
  ];
});

describe("CommsInbox", () => {
  it("groups a WhatsApp export into one chat and leaves the email on its own", async () => {
    render(<CommsInbox />);
    await waitFor(() => expect(screen.getByText("Priya Nair · priya@retail.co.uk")).toBeInTheDocument());

    // Four unfiled messages, but two things to act on.
    expect(screen.getByText("4 to file")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("3 messages")).toBeInTheDocument();
  });

  it("shows every message in a chat once it's opened", async () => {
    render(<CommsInbox />);
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Jane Smith"));
    expect(screen.getByText("Hey Adam, got the oil")).toBeInTheDocument();
    expect(screen.getByText("How is it going on your hands?")).toBeInTheDocument();
    // The newest line also shows in the collapsed preview above, so it's on
    // screen twice — that's the intended behaviour, not a duplicate render.
    expect(screen.getAllByText("Really good.").length).toBeGreaterThanOrEqual(1);
  });

  it("files every message in the chat when you pick the customer", async () => {
    render(<CommsInbox />);
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Jane Smith"));
    fireEvent.change(screen.getByPlaceholderText(/Who is this\?/i), { target: { value: "jane" } });

    const hit = await screen.findByText(/jane@example\.com/);
    fireEvent.click(hit);

    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(3));
    for (const call of rpc.mock.calls) {
      expect(call[0]).toBe("file_comms_message");
      expect((call[1] as { p_contact_id: string }).p_contact_id).toBe("c1");
    }
  });

  it("says so plainly when there is nothing waiting", async () => {
    messages = [];
    render(<CommsInbox />);
    await waitFor(() => expect(screen.getByText("Nothing waiting. ✓")).toBeInTheDocument());
  });
});
