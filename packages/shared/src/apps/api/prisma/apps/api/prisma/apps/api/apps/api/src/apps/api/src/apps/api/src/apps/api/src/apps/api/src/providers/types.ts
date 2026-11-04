export interface ChatTurn { role: "system" | "user" | "assistant"; content: string; }

export interface ChatProvider {
  stream(args: {
    model: string;
    messages: ChatTurn[];
    temperature?: number;
    maxTokens?: number;
    signal: AbortSignal;
  }): AsyncGenerator<{ delta?: string; tokensIn?: number; tokensOut?: number }>;
}

export interface ImageProvider {
  generate(args: {
    model: string; prompt: string; negativePrompt?: string;
    width: number; height: number; seed?: number; steps?: number; cfg?: number;
  }): Promise<{ url: string }>;
    }
