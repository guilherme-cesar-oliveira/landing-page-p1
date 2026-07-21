import {
  DEFAULT_WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '@/lib/content'

export type QuoteFormValues = {
  name: string
  phone: string
  service: string
  location: string
  details: string
}

export function buildWhatsAppMessage(values: QuoteFormValues) {
  return [
    DEFAULT_WHATSAPP_MESSAGE,
    '',
    `Nome: ${values.name.trim()}`,
    `Telefone: ${values.phone.trim()}`,
    `Servi\u00e7o: ${values.service.trim()}`,
    `Bairro/Cidade: ${values.location.trim() || 'N\u00e3o informado'}`,
    `Detalhes: ${values.details.trim()}`,
  ].join('\n')
}

export function buildWhatsAppUrl(message: string) {
  const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '')
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

export function buildQuoteWhatsAppUrl(values: QuoteFormValues) {
  return buildWhatsAppUrl(buildWhatsAppMessage(values))
}

export const GENERIC_WHATSAPP_URL = buildWhatsAppUrl(DEFAULT_WHATSAPP_MESSAGE)
