const API = "https://api.telegram.org";

function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data?: string; url?: string }[][];
};

export async function tgSendMessage(
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<boolean> {
  const token = botToken();
  if (!token) return false;
  const res = await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    }),
  });
  return res.ok;
}

export async function tgAnswerCallback(id: string, text?: string): Promise<void> {
  const token = botToken();
  if (!token) return;
  await fetch(`${API}/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text }),
  });
}
