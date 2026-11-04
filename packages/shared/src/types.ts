export type Tier = "ANON" | "FREE" | "PRO" | "PRO_PLUS" | "MAX";
export type ModelKind = "chat" | "image" | "video" | "tts" | "vision" | "embed";

export interface Model {
  id: string;
  slug: string;
  label: string;
  vendor: string;
  kind: ModelKind;
  description: string;
  contextWindow: number | null;
  creditsPer1kIn: number;
  creditsPer1kOut: number;
  creditsPerImage: number | null;
  nsfw: boolean;
  tierRequired: Tier;
  capabilities: string[];
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  model?: string;
  createdAt: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  url?: string;
  mediaId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImageJob {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  cfg?: number;
  status: "queued" | "running" | "done" | "error";
  url?: string;
  error?: string;
  createdAt: number;
}

export interface Me {
  id: string;
  tier: Tier;
  email: string | null;
  anon: boolean;
  credits: number;
  usedToday: number;
  dailyLimit: number;
}

export interface StreamEvent {
  type: "delta" | "usage" | "done" | "error" | "meta";
  text?: string;
  tokensIn?: number;
  tokensOut?: number;
  message?: string;
  creditsLeft?: number;
}
