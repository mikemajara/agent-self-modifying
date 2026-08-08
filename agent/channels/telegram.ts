import { telegramChannel, defaultTelegramAuth } from "eve/channels/telegram";
import type { TelegramMessage } from "eve/channels/telegram";
import { telegramOwnerUserId } from "../lib/owner.ts";

function shouldDispatch(message: TelegramMessage, botUsername?: string): boolean {
  if (message.from?.isBot === true || message.chat.type === "channel") return false;
  const text = message.text || message.caption || "";
  const hasContent = text.trim().length > 0 || message.attachments.length > 0;
  if (!hasContent) return false;
  if (message.chat.type === "private") return true;
  if (message.replyToMessage?.from?.isBot === true) return true;
  if (/^\/[A-Za-z0-9_]+/.test(text)) return true;
  if (botUsername && text.toLowerCase().includes(`@${botUsername.toLowerCase()}`)) {
    return true;
  }
  return false;
}

export default telegramChannel({
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  credentials: {
    botToken: () => process.env.TELEGRAM_BOT_TOKEN!,
    webhookSecretToken: () => process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN ?? "",
  },
  async onMessage(ctx, message) {
    if (!shouldDispatch(message, ctx.telegram.botUsername)) return null;

    const ownerId = telegramOwnerUserId();
    const fromId = message.from?.id != null ? String(message.from.id) : undefined;

    if (ownerId && fromId && fromId !== ownerId) {
      await ctx.telegram.sendMessage(
        "This agent only accepts messages from its linked owner.",
      );
      return null;
    }

    const auth = defaultTelegramAuth(message);
    if (!auth) return null;

    await ctx.telegram.startTyping();

    return {
      auth: {
        ...auth,
        attributes: {
          ...auth.attributes,
          channel: "telegram",
          tenantId: process.env.AGENT_TENANT_ID ?? "default",
          isOwner: !ownerId || fromId === ownerId ? "true" : "false",
        },
      },
    };
  },
});
