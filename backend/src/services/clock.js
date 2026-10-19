// Data e hora "agora" no fuso do Meets (padrão: horário de Brasília).
// Os eventos são cadastrados no horário local; o servidor (ex.: Render) roda em UTC.
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Sao_Paulo';

export function nowParts(timeZone = APP_TIMEZONE, at = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

// O driver do PostgreSQL devolve DATE como Date à meia-noite local; aqui vira 'AAAA-MM-DD'.
export function dateOnly(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 10);
}

// true quando a data + horário de término já passaram no fuso do Meets.
export function hasEnded(dateValue, timeValue, now = nowParts()) {
  if (!dateValue || !timeValue) return false;
  return `${dateOnly(dateValue)} ${String(timeValue).slice(0, 5)}` <= `${now.date} ${now.time}`;
}
