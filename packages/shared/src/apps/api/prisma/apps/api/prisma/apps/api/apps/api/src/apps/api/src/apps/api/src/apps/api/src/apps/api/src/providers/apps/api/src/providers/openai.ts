import { env } from "../env.js";
import type { ChatProvider, ImageProvider } from "./types.js";

const auth = { Authorization: `Bearer ${env.OPENAI_API_KEY}` };

export const openaiChat: ChatProvider = {
  async *stream({ model, messages, temperature = 0.7, maxTokens = 4096, signal }) {
    const res = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
      signal
    });
    if (!res.ok || !res.body) throw new Error(`provider ${res.status}: ${await res.text()}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) yield { delta };
          if (j.usage) yield { tokensIn: j.usage.prompt_tokens, tokensOut: j.usage.completion_tokens };
        } catch { /* chunk parsial */ }
      }
    }
  }
};

export const openaiImage: ImageProvider = {
  async generate({ prompt, width, height }) {
    const res = await fetch(`${env.OPENAI_BASE_URL}/images/generations`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.IMAGE_MODEL, prompt, size: `${width}x${height}`,
        n: 1, response_format: "url"
      })
    });
    if (!res.ok) throw new Error(`provider ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return { url: j.data[0].url ?? `data:image/png;base64,${j.data[0].b64_json}` };
  }
};
