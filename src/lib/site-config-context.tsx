import {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ADMIN_CREDENTIALS,
  ADMIN_SESSION_STORAGE_KEY,
  SITE_DATABASE_STORAGE_KEY,
  SITE_DATABASE_URL,
  buildGenericWhatsAppUrl,
  cloneSiteConfig,
  cloneSiteDatabase,
  createFallbackSiteDatabase,
  resolvePublicAssetUrl,
  slugifyPresetName,
  syncDatabaseWithCurrentConfig,
  type SiteConfig,
  type SiteDatabase,
  type SitePreset,
} from '@/lib/site-config'

type SiteConfigContextValue = {
  database: SiteDatabase
  currentConfig: SiteConfig
  isReady: boolean
  isAdminAuthenticated: boolean
  saveCurrentConfig: (config: SiteConfig) => void
  applyPreset: (presetId: string) => void
  createPreset: (name: string, config?: SiteConfig) => void
  deletePreset: (presetId: string) => void
  exportDatabase: () => string
  importDatabase: (raw: string) => { ok: boolean; error?: string }
  resetDatabase: () => void
  signIn: (username: string, password: string) => boolean
  signOut: () => void
  publishedUrl: string
  genericWhatsAppUrl: string
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null)

function parseStoredDatabase(raw: string | null) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as SiteDatabase
    return parsed
  } catch {
    return null
  }
}

async function loadSourceDatabase() {
  try {
    const url = new URL(SITE_DATABASE_URL, window.location.href).toString()
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`Failed to load site database: ${response.status}`)
    }

    return (await response.json()) as SiteDatabase
  } catch {
    return createFallbackSiteDatabase()
  }
}

function persistDatabase(database: SiteDatabase) {
  window.localStorage.setItem(
    SITE_DATABASE_STORAGE_KEY,
    JSON.stringify(database, null, 2),
  )
}

function touchDatabase(database: SiteDatabase) {
  return {
    ...database,
    updatedAt: new Date().toISOString(),
  }
}

function getTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function pickMostRecentDatabase(
  sourceDatabase: SiteDatabase,
  storedDatabase: SiteDatabase | null,
) {
  if (!storedDatabase) {
    return sourceDatabase
  }

  return getTimestamp(storedDatabase.updatedAt) >=
    getTimestamp(sourceDatabase.updatedAt)
    ? storedDatabase
    : sourceDatabase
}

function ensureMeta(name: string, content: string, attr: 'name' | 'property') {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${name}"]`,
  )

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function ensureLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }

  tag.setAttribute('href', href)
}

function applyThemeColors(config: SiteConfig) {
  const root = document.documentElement
  root.style.setProperty('--background', config.colors.background)
  root.style.setProperty('--surface', config.colors.surface)
  root.style.setProperty('--surface-strong', config.colors.surfaceStrong)
  root.style.setProperty('--foreground', config.colors.foreground)
  root.style.setProperty('--foreground-muted', config.colors.foregroundMuted)
  root.style.setProperty('--brand', config.colors.brand)
  root.style.setProperty('--brand-foreground', config.colors.brandForeground)
  root.style.setProperty('--border', config.colors.border)
  root.style.setProperty('--ring', config.colors.ring)
  root.style.setProperty('--whatsapp', config.colors.whatsapp)
  root.style.setProperty(
    '--whatsapp-foreground',
    config.colors.whatsappForeground,
  )
}

function applySeo(config: SiteConfig) {
  document.title = config.seo.title || config.branding.siteTitle
  document.documentElement.lang = config.branding.locale

  ensureMeta('description', config.seo.description, 'name')
  ensureMeta('keywords', config.seo.keywords, 'name')
  ensureMeta('robots', config.seo.robots, 'name')
  ensureMeta('theme-color', config.seo.themeColor, 'name')
  ensureMeta('og:title', config.seo.ogTitle, 'property')
  ensureMeta('og:description', config.seo.ogDescription, 'property')
  ensureMeta('og:type', config.seo.ogType, 'property')
  ensureMeta(
    'og:url',
    config.seo.canonicalUrl || window.location.href.split('#')[0],
    'property',
  )
  ensureMeta('og:image', resolvePublicAssetUrl(config.seo.ogImage), 'property')
  ensureMeta('twitter:card', config.seo.twitterCard, 'name')
  ensureMeta('twitter:title', config.seo.ogTitle, 'name')
  ensureMeta('twitter:description', config.seo.ogDescription, 'name')
  ensureMeta(
    'twitter:image',
    resolvePublicAssetUrl(config.seo.ogImage),
    'name',
  )

  ensureLink('canonical', config.seo.canonicalUrl || window.location.href)
  ensureLink('icon', resolvePublicAssetUrl(config.branding.faviconUrl))
}

function recreateNode(node: ChildNode, scope: string): ChildNode {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) {
    return node.cloneNode(true) as ChildNode
  }

  const element = node as HTMLElement

  if (element.tagName === 'SCRIPT') {
    const script = document.createElement('script')

    Array.from(element.attributes).forEach((attribute) => {
      script.setAttribute(attribute.name, attribute.value)
    })

    script.text = element.textContent ?? ''
    script.setAttribute('data-site-snippet', scope)
    return script
  }

  const clone = element.cloneNode(false) as HTMLElement
  clone.setAttribute('data-site-snippet', scope)

  Array.from(element.childNodes).forEach((child) => {
    clone.appendChild(recreateNode(child, scope))
  })

  return clone
}

function mountSnippet(
  target: HTMLElement,
  html: string,
  scope: string,
) {
  if (!html.trim()) {
    return () => undefined
  }

  const template = document.createElement('template')
  template.innerHTML = html

  const nodes = Array.from(template.content.childNodes).map((node) =>
    recreateNode(node, scope),
  )

  nodes.forEach((node) => {
    target.appendChild(node)
  })

  return () => {
    nodes.forEach((node) => {
      node.parentNode?.removeChild(node)
    })
  }
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [sourceDatabase, setSourceDatabase] = useState<SiteDatabase>(
    createFallbackSiteDatabase(),
  )
  const [database, setDatabase] = useState<SiteDatabase>(
    createFallbackSiteDatabase(),
  )
  const [isReady, setIsReady] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const source = await loadSourceDatabase()
      const stored = parseStoredDatabase(
        window.localStorage.getItem(SITE_DATABASE_STORAGE_KEY),
      )
      const session =
        window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === 'true'

      if (!active) {
        return
      }

      setSourceDatabase(source)
      setDatabase(pickMostRecentDatabase(source, stored))
      setIsAdminAuthenticated(session)
      setIsReady(true)
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    applyThemeColors(database.currentConfig)
    applySeo(database.currentConfig)

    const cleanupHead = mountSnippet(
      document.head,
      database.currentConfig.snippets.head,
      'head',
    )
    const cleanupBody = mountSnippet(
      document.body,
      database.currentConfig.snippets.body,
      'body',
    )

    return () => {
      cleanupHead()
      cleanupBody()
    }
  }, [database])

  const contextValue = useMemo<SiteConfigContextValue>(() => {
    function updateDatabase(nextDatabase: SiteDatabase) {
      const touched = touchDatabase(nextDatabase)
      setDatabase(touched)
      persistDatabase(touched)
    }

    return {
      database,
      currentConfig: database.currentConfig,
      isReady,
      isAdminAuthenticated,
      saveCurrentConfig(config) {
        updateDatabase(syncDatabaseWithCurrentConfig(database, config))
      },
      applyPreset(presetId) {
        const preset = database.presets.find((item) => item.id === presetId)

        if (!preset) {
          return
        }

        updateDatabase({
          ...cloneSiteDatabase(database),
          currentPresetId: preset.id,
          currentConfig: cloneSiteConfig(preset.config),
        })
      },
      createPreset(name, config = database.currentConfig) {
        const baseId = slugifyPresetName(name) || `preset-${Date.now()}`
        const uniqueId = database.presets.some((preset) => preset.id === baseId)
          ? `${baseId}-${Date.now()}`
          : baseId

        const nextPreset: SitePreset = {
          id: uniqueId,
          name,
          config: cloneSiteConfig(config),
        }

        updateDatabase({
          ...cloneSiteDatabase(database),
          presets: [...database.presets, nextPreset],
          currentPresetId: uniqueId,
        })
      },
      deletePreset(presetId) {
        const filteredPresets = database.presets.filter(
          (preset) => preset.id !== presetId,
        )

        if (filteredPresets.length === database.presets.length) {
          return
        }

        const fallbackPreset = filteredPresets[0]

        updateDatabase({
          ...cloneSiteDatabase(database),
          presets: filteredPresets,
          currentPresetId:
            database.currentPresetId === presetId
              ? fallbackPreset?.id ?? 'default'
              : database.currentPresetId,
          currentConfig:
            database.currentPresetId === presetId && fallbackPreset
              ? cloneSiteConfig(fallbackPreset.config)
              : cloneSiteConfig(database.currentConfig),
        })
      },
      exportDatabase() {
        return JSON.stringify(database, null, 2)
      },
      importDatabase(raw) {
        try {
          const parsed = JSON.parse(raw) as SiteDatabase

          if (!parsed.currentConfig || !Array.isArray(parsed.presets)) {
            return { ok: false, error: 'Estrutura JSON inválida.' }
          }

          updateDatabase(parsed)
          return { ok: true }
        } catch {
          return { ok: false, error: 'Não foi possível ler o JSON informado.' }
        }
      },
      resetDatabase() {
        const nextSource = cloneSiteDatabase(sourceDatabase)
        setDatabase(nextSource)
        persistDatabase(nextSource)
      },
      signIn(username, password) {
        const isValid =
          username === ADMIN_CREDENTIALS.username &&
          password === ADMIN_CREDENTIALS.password

        if (isValid) {
          setIsAdminAuthenticated(true)
          window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'true')
        }

        return isValid
      },
      signOut() {
        setIsAdminAuthenticated(false)
        window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      },
      publishedUrl: window.location.href.split('#')[0],
      genericWhatsAppUrl: buildGenericWhatsAppUrl(database.currentConfig),
    }
  }, [database, isAdminAuthenticated, isReady, sourceDatabase])

  return (
    <SiteConfigContext.Provider value={contextValue}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export { SiteConfigContext }
