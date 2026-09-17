// Orbital Workbench: a single frontend boundary for the future same-origin PHP contact endpoint.
export type ContactPayload = { name: string; email: string; subject: string; message: string };
type ContactResponse = { ok: true; requestId?: string };

const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim();
export const contactApiConfigured = Boolean(endpoint);

export async function submitContact(payload: ContactPayload): Promise<ContactResponse> {
  if (!endpoint) throw new Error("The feedback API has not been configured for this build.");
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null) as { ok?: boolean; requestId?: string; error?: { message?: string } } | null;
  if (!response.ok || !body?.ok) throw new Error(body?.error?.message || "The feedback request could not be sent. Please try again later.");
  return { ok: true, requestId: body.requestId };
}
