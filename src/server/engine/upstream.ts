export interface UpstreamMessage {
  role: string;
  content: string;
}

export type UpstreamErrorKind = "auth" | "rate" | "badrequest" | "server" | "network";

export type UpstreamEvent =
  | { type: "chunk"; delta: string }
  | { type: "usage"; tokensIn: number; tokensOut: number }
  | { type: "done" };

export type UpstreamOpen =
  | { ok: true; stream: AsyncGenerator<UpstreamEvent> }
  | { ok: false; status: number; kind: UpstreamErrorKind; message: string };

interface UpstreamChunk {
  choices?: { delta?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function classify(status: number): UpstreamErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate";
  if (status === 400 || status === 404 || status === 422) return "badrequest";
  return "server";
}

export async function openUpstream(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: UpstreamMessage[];
  signal?: AbortSignal;
}): Promise<UpstreamOpen> {
  let res: Response;
  try {
    res = await fetch(opts.baseUrl.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      signal: opts.signal,
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + opts.apiKey
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        stream: true,
        stream_options: { include_usage: true }
      })
    });
  } catch (e) {
    return { ok: false, status: 0, kind: "network", message: e instanceof Error ? e.message : "network error" };
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, kind: classify(res.status), message: text.slice(0, 300) };
  }
  return { ok: true, stream: parseSse(res.body) };
}

async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<UpstreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trimEnd();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        const obj = parsed as UpstreamChunk;
        if (obj.usage) {
          yield { type: "usage", tokensIn: obj.usage.prompt_tokens ?? 0, tokensOut: obj.usage.completion_tokens ?? 0 };
        }
        const delta = obj.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          yield { type: "chunk", delta };
        }
      }
    }
  } finally {
    reader.releaseLock();
    await body.cancel().catch(() => {});
  }
}
