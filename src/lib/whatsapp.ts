/** WhatsApp click-to-chat address for a phone number. A leading 0 is read as a Kenyan number (254). Null when there is no usable number. */
export function whatsappHref(phone: string | null, text: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
