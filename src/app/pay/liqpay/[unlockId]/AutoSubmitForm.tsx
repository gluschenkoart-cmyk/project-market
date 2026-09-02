"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface AutoSubmitFormProps {
  actionUrl: string;
  data: string;
  signature: string;
}

/** Сама відправляє себе одразу після завантаження сторінки — так LiqPay
 * (і будь-який інший провайдер із таким самим "POST + редірект"
 * підходом) отримує підписані параметри без зайвого кліку людини.
 * Кнопка нижче — резерв, якщо автовідправка не спрацювала (JS вимкнено,
 * розширення браузера заблокувало скрипт тощо). */
export function AutoSubmitForm({ actionUrl, data, signature }: AutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} action={actionUrl} method="POST" className="flex flex-col gap-3">
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="signature" value={signature} />
      <Button type="submit">Перейти до оплати</Button>
    </form>
  );
}
