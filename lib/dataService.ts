import type { InternalChatMessage } from "@/types/index";

export type { InternalChatMessage };

/**
 * Internal chat between doctor and secretary.
 *
 * Every call goes through the session-protected /api/messages route: the
 * clinic id, sender role and sender name are derived from the server-side
 * session, never from the client. There is no local cache and no seeded
 * fallback — an unreachable backend surfaces as an empty list / a thrown
 * error instead of fabricated messages.
 */

interface MessagesResponse {
  success: boolean;
  error?: string;
  messages?: InternalChatMessage[];
}

interface MessageResponse {
  success: boolean;
  error?: string;
  message?: InternalChatMessage;
}

const readJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw new Error(`messages request failed with ${res.status}`);
  }
  return (await res.json()) as T;
};

export async function fetchInternalMessages(channelId?: string): Promise<InternalChatMessage[]> {
  try {
    const url = channelId
      ? `/api/messages?channelId=${encodeURIComponent(channelId)}`
      : "/api/messages";
    const payload = await readJson<MessagesResponse>(await fetch(url, { cache: "no-store" }));
    if (!payload.success) throw new Error(payload.error || "messages request failed");
    return payload.messages ?? [];
  } catch (err) {
    console.warn("fetchInternalMessages failed:", err);
    return [];
  }
}

/**
 * Persists one outgoing message. The server owns identity fields
 * (senderRole / senderName / clinicId / sentAt), so they are not sent.
 */
export async function saveInternalMessage(
  msg: Pick<InternalChatMessage, "channelId" | "content"> & { id?: string }
): Promise<InternalChatMessage> {
  const content = msg.content?.trim();
  if (!content) {
    throw new Error("Message content is required");
  }

  const payload = await readJson<MessageResponse>(
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, channelId: msg.channelId, content }),
    })
  );

  if (!payload.success || !payload.message) {
    throw new Error(payload.error || "Message was not saved");
  }
  return payload.message;
}

export async function markInternalMessagesAsRead(channelId: string): Promise<void> {
  const payload = await readJson<MessagesResponse>(
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    })
  );
  if (!payload.success) {
    throw new Error(payload.error || "Failed to mark messages as read");
  }
}
