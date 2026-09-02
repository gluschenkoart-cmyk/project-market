/**
 * Форматування контактних каналів (Етап 6, "Угода"). `User.telegram` і
 * `User.whatsapp` — вільний текст (людина може вписати як @юзернейм, так і
 * номер телефону для Telegram; WhatsApp — завжди номер) — тут одна логіка
 * перетворення того, що людина ввела, на клікабельне посилання, щоб не
 * дублювати цей розбір і в профілі, і на сторінці проєкту.
 */

export interface ContactLink {
  label: string;
  href: string;
}

/** Лишає тільки цифри й, якщо є, ведучий "+" — для побудови посилань
 * (t.me/+380…, wa.me/380…), яким символи форматування (дужки, тире,
 * пробіли) заважають. */
function digitsOnly(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function looksLikePhone(value: string): boolean {
  return /^\+?\d[\d\s()-]{5,}$/.test(value.trim());
}

/**
 * Telegram приймає і @юзернейм (посилання t.me/username), і номер
 * телефону (посилання t.me/+380…, якщо в людини увімкнено "знаходити за
 * номером" — Telegram сам покаже помилку, якщо ні; це не наша
 * відповідальність). Розпізнаємо за виглядом уведеного значення.
 */
export function formatTelegramContact(raw: string | null | undefined): ContactLink | null {
  const value = raw?.trim();
  if (!value) return null;

  if (looksLikePhone(value)) {
    const digits = digitsOnly(value).replace(/^00/, "+");
    const normalized = digits.startsWith("+") ? digits : `+${digits}`;
    return { label: `Telegram: ${value}`, href: `https://t.me/${normalized}` };
  }

  const username = value.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  return { label: `Telegram: @${username}`, href: `https://t.me/${username}` };
}

/** WhatsApp завжди за номером телефону — офіційний формат посилання
 * wa.me/<код країни і номер, без "+" і форматування>. */
export function formatWhatsappContact(raw: string | null | undefined): ContactLink | null {
  const value = raw?.trim();
  if (!value) return null;

  const digits = digitsOnly(value).replace(/^\+/, "");
  return { label: `WhatsApp: ${value}`, href: `https://wa.me/${digits}` };
}
