import type { ChatProvider, ImageProvider } from "./types.js";

/** Provider offline: aplikasi tetap jalan tanpa API key. */
export const mockChat: ChatProvider = {
  async *stream({ messages }) {
    const last = messages.filter(m => m.role === "user").at(-1)?.content ?? "";
    const words = `Echo dari mock provider: ${last}. Ganti CHAT_PROVIDER=openai untuk hasil nyata.`.split(" ");
    for (const w of words) {
      await new Promise(r => setTimeout(r, 35));
      yield { delta: w + " " };
    }
    yield { tokensIn: 12, tokensOut: words.length };
  }
};

export const mockImage: ImageProvider = {
  async generate({ prompt, width, height }) {
    const enc = encodeURIComponent(prompt.slice(0, 120));
    return { url: `https://image.pollinations.ai/prompt/${enc}?width=${width}&height=${height}&nologo=true` };
  }
};
