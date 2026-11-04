import { env } from "../env.js";
import { openaiChat, openaiImage } from "./openai.js";
import { mockChat, mockImage } from "./mock.js";

export const chatProvider = env.CHAT_PROVIDER === "openai" ? openaiChat : mockChat;
export const imageProvider = env.IMAGE_PROVIDER === "openai" ? openaiImage : mockImage;
