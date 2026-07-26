export const ADMIN_HASH_ROUTE = '#/admin'
export const SITE_HASH_ROUTE = '#/'
export const SITE_DATABASE_URL = 'site-admin-db.json'
export const SITE_DATABASE_STORAGE_KEY = 'landing-page.site-database.v1'
export const ADMIN_SESSION_STORAGE_KEY = 'landing-page.admin-session.v1'
export const ADMIN_RUNTIME_AUTH_STORAGE_KEY =
  'landing-page.admin-runtime-auth.v1'

export type QuoteFormValues = {
  name: string
  phone: string
  service: string
  location: string
  details: string
}

export type ThemeColors = {
  background: string
  surface: string
  surfaceStrong: string
  foreground: string
  foregroundMuted: string
  brand: string
  brandForeground: string
  border: string
  ring: string
  whatsapp: string
  whatsappForeground: string
}

export type SiteMetric = {
  value: string
  label: string
}

export type ServiceItem = {
  number: string
  title: string
  description: string
}

export type ProcessStep = {
  number: string
  title: string
  description: string
}

export type SiteConfig = {
  branding: {
    locale: string
    siteTitle: string
    brandName: string
    brandSubtitle: string
    faviconUrl: string
  }
  contact: {
    whatsappNumber: string
    whatsappDisplay: string
    defaultMessage: string
  }
  colors: ThemeColors
  seo: {
    title: string
    description: string
    keywords: string
    canonicalUrl: string
    robots: string
    ogTitle: string
    ogDescription: string
    ogImage: string
    ogType: string
    twitterCard: string
    themeColor: string
  }
  snippets: {
    head: string
    body: string
  }
  header: {
    ctaLabel: string
  }
  hero: {
    eyebrow: string
    titleLineOne: string
    titleLineTwo: string
    titleHighlight: string
    description: string
    primaryCtaLabel: string
    secondaryCtaLabel: string
  }
  sidePanel: {
    eyebrow: string
    responseValue: string
    responseDescription: string
    tags: [string, string, string]
    footerNote: string
  }
  metrics: [SiteMetric, SiteMetric, SiteMetric]
  servicesSection: {
    eyebrow: string
    title: string
    description: string
  }
  services: [
    ServiceItem,
    ServiceItem,
    ServiceItem,
    ServiceItem,
    ServiceItem,
    ServiceItem,
  ]
  processSection: {
    eyebrow: string
    title: string
    description: string
  }
  processSteps: [ProcessStep, ProcessStep, ProcessStep]
  quoteSection: {
    eyebrow: string
    title: string
    description: string
    supportText: string
    submitLabel: string
    helperText: string
  }
  form: {
    nameLabel: string
    namePlaceholder: string
    phoneLabel: string
    phonePlaceholder: string
    serviceLabel: string
    servicePlaceholder: string
    locationLabel: string
    locationPlaceholder: string
    detailsLabel: string
    detailsPlaceholder: string
    serviceOptions: string[]
    validationNameRequired: string
    validationPhoneRequired: string
    validationServiceRequired: string
    validationDetailsRequired: string
    locationNotProvidedLabel: string
  }
  footer: {
    whatsappLabelPrefix: string
    legalText: string
  }
}

export type SitePreset = {
  id: string
  name: string
  config: SiteConfig
}

export type SiteDatabase = {
  version: 1
  updatedAt: string
  currentPresetId: string
  currentConfig: SiteConfig
  presets: SitePreset[]
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  background: '#0b0a08',
  surface: '#12100d',
  surfaceStrong: '#181512',
  foreground: '#f6f1e8',
  foregroundMuted: '#9c9488',
  brand: '#d9ab43',
  brandForeground: '#080705',
  border: 'rgba(217, 171, 67, 0.34)',
  ring: 'rgba(244, 196, 78, 0.72)',
  whatsapp: '#43a76d',
  whatsappForeground: '#f5fff9',
}

export function createFallbackSiteConfig(): SiteConfig {
  return {
    branding: {
      locale: 'pt-BR',
      siteTitle: 'Junior Soluções Residenciais',
      brandName: 'Junior',
      brandSubtitle: 'Soluções residenciais',
      faviconUrl: './favicon.svg',
    },
    contact: {
      whatsappNumber: '5547984419705',
      whatsappDisplay: '(47) 98441-9705',
      defaultMessage: 'Olá! Vim pela landing e gostaria de um orçamento.',
    },
    colors: { ...DEFAULT_THEME_COLORS },
    seo: {
      title: 'Junior Soluções Residenciais',
      description:
        'Montagem, reparo e instalação com atendimento rápido por WhatsApp para serviços residenciais e comerciais.',
      keywords:
        'manutenção residencial, manutenção comercial, montagem de móveis, reparos elétricos, reparos hidráulicos, marido de aluguel',
      canonicalUrl: 'https://guilherme-cesar-oliveira.github.io/landing-page-p1/',
      robots: 'index,follow',
      ogTitle: 'Junior Soluções Residenciais',
      ogDescription:
        'Solicite orçamento rápido por WhatsApp para montagem, reparos e instalações residenciais e comerciais.',
      ogImage: './hero-share.png',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      themeColor: '#0b0a08',
    },
    snippets: {
      head: '',
      body: '',
    },
    header: {
      ctaLabel: 'WhatsApp',
    },
    hero: {
      eyebrow: 'Soluções em manutenção · residencial e comercial',
      titleLineOne: 'Casa',
      titleLineTwo: 'em',
      titleHighlight: 'ordem.',
      description:
        'Montagem, reparo, instalação. Você chama, eu resolvo — rápido, direto e sem enrolação.',
      primaryCtaLabel: 'Solicitar orçamento',
      secondaryCtaLabel: 'Ver serviços',
    },
    sidePanel: {
      eyebrow: 'Atendimento residencial',
      responseValue: '24h',
      responseDescription:
        'Resposta rápida no WhatsApp, com escopo claro e valor fechado antes de começar.',
      tags: [
        'Montagem de móveis',
        'Reparos elétricos',
        'Manutenção geral',
      ],
      footerNote:
        'Olá! Vim pela landing e gostaria de um orçamento. O resto a gente combina no atendimento.',
    },
    metrics: [
      { value: '300+', label: 'Atendimentos' },
      { value: '5.0', label: 'Avaliação média' },
      { value: '24h', label: 'Resposta' },
    ],
    servicesSection: {
      eyebrow: 'Índice',
      title: 'O que eu resolvo',
      description: 'Seis frentes de trabalho, direto ao ponto.',
    },
    services: [
      {
        number: '01',
        title: 'Montagem de móveis',
        description:
          'Guarda-roupas, cama, estante, cozinha planejada. Toda a linha de móveis do convencional ao corporativo.',
      },
      {
        number: '02',
        title: 'Reparos elétricos',
        description:
          'Tomadas, interruptores, luminárias. Elétrica e reparo em geral.',
      },
      {
        number: '03',
        title: 'Reparos hidráulicos',
        description:
          'Vazamentos, registros, torneiras, chuveiros. Hidráulica em geral.',
      },
      {
        number: '04',
        title: 'Instalação de itens',
        description: 'Prateleiras, quadros, cortinas, suporte de TV.',
      },
      {
        number: '05',
        title: 'Manutenção geral',
        description:
          'Portas, dobradiças, fechaduras, rejuntes, limpeza de caixa d’água, toda a parte de manutenção residencial.',
      },
      {
        number: '06',
        title: 'Pintura e retoques',
        description: 'Paredes, ambientes pequenos, acabamentos.',
      },
    ],
    processSection: {
      eyebrow: 'Processo',
      title: 'Do pedido à entrega',
      description:
        'Sem mistério: você chama, a gente combina e o serviço termina limpo e funcionando.',
    },
    processSteps: [
      {
        number: '01',
        title: 'Você chama',
        description: 'Formulário ou WhatsApp — conta o que precisa.',
      },
      {
        number: '02',
        title: 'Combinamos',
        description: 'Escopo, prazo e valor fechados antes de tudo.',
      },
      {
        number: '03',
        title: 'Está pronto',
        description: 'Serviço feito, local limpo, tudo funcionando.',
      },
    ],
    quoteSection: {
      eyebrow: 'Solicitação',
      title: 'Peça seu orçamento',
      description:
        'Preencha o essencial e abra a conversa com a mensagem pronta no WhatsApp.',
      supportText:
        'Nome, contato, serviço, região e detalhes. O suficiente para responder rápido e sem ida e volta desnecessária.',
      submitLabel: 'Enviar pelo WhatsApp',
      helperText:
        'Ao enviar, o WhatsApp abre com sua mensagem pronta.',
    },
    form: {
      nameLabel: 'Nome',
      namePlaceholder: 'Seu nome',
      phoneLabel: 'Telefone',
      phonePlaceholder: '(00) 00000-0000',
      serviceLabel: 'Serviço',
      servicePlaceholder: 'Selecione',
      locationLabel: 'Bairro / Cidade',
      locationPlaceholder: 'Ex: Centro, São Paulo',
      detailsLabel: 'Descreva o que precisa',
      detailsPlaceholder: 'Conte os detalhes...',
      serviceOptions: [
        'Montagem de móveis',
        'Reparo elétrico',
        'Reparo hidráulico',
        'Instalação de itens',
        'Manutenção geral',
        'Pintura e retoques',
        'Outro',
      ],
      validationNameRequired: 'Preencha seu nome.',
      validationPhoneRequired: 'Informe um telefone para contato.',
      validationServiceRequired: 'Selecione o serviço.',
      validationDetailsRequired: 'Descreva o que precisa.',
      locationNotProvidedLabel: 'Não informado',
    },
    footer: {
      whatsappLabelPrefix: 'WhatsApp',
      legalText: 'Atendimento em sua região · © 2026',
    },
  }
}

export function createFallbackSiteDatabase(): SiteDatabase {
  const config = createFallbackSiteConfig()

  return {
    version: 1,
    updatedAt: '2026-07-25T00:00:00.000Z',
    currentPresetId: 'default',
    currentConfig: config,
    presets: [
      {
        id: 'default',
        name: 'Padrão Junior',
        config,
      },
    ],
  }
}

export function cloneSiteConfig(config: SiteConfig): SiteConfig {
  return structuredClone(config)
}

export function cloneSiteDatabase(database: SiteDatabase): SiteDatabase {
  return structuredClone(database)
}

export function syncDatabaseWithCurrentConfig(
  database: SiteDatabase,
  config: SiteConfig,
) {
  const nextDatabase = cloneSiteDatabase(database)
  const nextConfig = cloneSiteConfig(config)

  nextDatabase.updatedAt = new Date().toISOString()
  nextDatabase.currentPresetId = 'default'
  nextDatabase.currentConfig = nextConfig

  const defaultPresetIndex = nextDatabase.presets.findIndex(
    (preset) => preset.id === 'default',
  )

  if (defaultPresetIndex >= 0) {
    nextDatabase.presets[defaultPresetIndex] = {
      ...nextDatabase.presets[defaultPresetIndex],
      config: cloneSiteConfig(nextConfig),
    }
  } else {
    nextDatabase.presets.unshift({
      id: 'default',
      name: 'Padrão Junior',
      config: cloneSiteConfig(nextConfig),
    })
  }

  return nextDatabase
}

export function slugifyPresetName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function sanitizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, '')
}

export function buildWhatsAppMessage(
  values: QuoteFormValues,
  config: SiteConfig,
) {
  return [
    config.contact.defaultMessage,
    '',
    `${config.form.nameLabel}: ${values.name.trim()}`,
    `${config.form.phoneLabel}: ${values.phone.trim()}`,
    `${config.form.serviceLabel}: ${values.service.trim()}`,
    `${config.form.locationLabel}: ${
      values.location.trim() || config.form.locationNotProvidedLabel
    }`,
    `${config.form.detailsLabel}: ${values.details.trim()}`,
  ].join('\n')
}

export function buildWhatsAppUrl(number: string, message: string) {
  const cleanNumber = sanitizeWhatsAppNumber(number)
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

export function buildQuoteWhatsAppUrl(
  values: QuoteFormValues,
  config: SiteConfig,
) {
  return buildWhatsAppUrl(
    config.contact.whatsappNumber,
    buildWhatsAppMessage(values, config),
  )
}

export function buildGenericWhatsAppUrl(config: SiteConfig) {
  return buildWhatsAppUrl(
    config.contact.whatsappNumber,
    config.contact.defaultMessage,
  )
}

export function resolvePublicAssetUrl(value: string) {
  if (!value.trim()) {
    return ''
  }

  try {
    return new URL(value, window.location.href).toString()
  } catch {
    return value
  }
}
