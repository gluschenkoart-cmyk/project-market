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

function looksLikePhone(value: string): boolean {
  return /^\+?\d[\d\s()-]{5,}$/.test(value.trim());
}

/** Українські мобільні номери — 9 значущих цифр після коду країни (380),
 * тобто місцевий запис без коду країни завжди має 10 цифр і починається
 * з "0" (напр. 0671234567) — типовий формат для аудиторії цього
 * застосунку (KNUBA та інші українські виші, CLAUDE.md). */
const UA_LOCAL_MOBILE_LENGTH = 10;
const UA_COUNTRY_CODE = "380";

/**
 * Зводить будь-який формат номера (як людина реально вводить: з "+", з
 * міжнародним "00…", чи місцевий український без коду країни) до самих
 * цифр із кодом країни, без "+" і без ведучих нулів — саме такий формат
 * приймають і t.me (для номера, не юзернейму), і wa.me в URL.
 *
 * Приклади: "+380 67 123 45 67" → "380671234567"; "00380671234567" →
 * "380671234567" (той самий номер, лише через міжнародний префікс
 * "00" замість "+" — раніше тут була розбіжність між Telegram і
 * WhatsApp: перший розпізнавав "00", другий — ні); "0671234567"
 * (місцевий формат без коду країни) → "380671234567" (додаємо код
 * України, а не залишаємо як недійсний номер); "380671234567" (уже без
 * "+") → лишається як є.
 */
function normalizePhoneDigits(value: string): string {
  const hasLeadingPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");

  if (hasLeadingPlus) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === UA_LOCAL_MOBILE_LENGTH && digits.startsWith("0")) {
    return UA_COUNTRY_CODE + digits.slice(1);
  }
  return digits;
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
    return { label: `Telegram: ${value}`, href: `https://t.me/+${normalizePhoneDigits(value)}` };
  }

  const username = value.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  return { label: `Telegram: @${username}`, href: `https://t.me/${username}` };
}

/** WhatsApp завжди за номером телефону — офіційний формат посилання
 * wa.me/<код країни і номер, без "+" і форматування>. */
export function formatWhatsappContact(raw: string | null | undefined): ContactLink | null {
  const value = raw?.trim();
  if (!value) return null;

  return { label: `WhatsApp: ${value}`, href: `https://wa.me/${normalizePhoneDigits(value)}` };
}
