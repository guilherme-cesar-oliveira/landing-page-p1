import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ChevronDown,
  Download,
  FileJson,
  Globe,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Palette,
  Save,
  Settings2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ADMIN_GITHUB_TOKEN_STORAGE_KEY,
  GITHUB_PUBLISH_TARGET,
  SITE_HASH_ROUTE,
  cloneSiteConfig,
  resolvePublicAssetUrl,
  syncDatabaseWithCurrentConfig,
  type SiteDatabase,
} from '@/lib/site-config'
import { useSiteConfig } from '@/lib/use-site-config'

function encodeBase64Unicode(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getStoredGithubToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ADMIN_GITHUB_TOKEN_STORAGE_KEY) ?? ''
}

function seedGithubTokenFromHash() {
  if (typeof window === 'undefined') {
    return null
  }

  const [hashPath, hashQuery = ''] = window.location.hash.split('?')
  const params = new URLSearchParams(hashQuery)
  const token = params.get('admin_token')?.trim()

  if (hashPath !== '#/admin' || !token) {
    return null
  }

  window.localStorage.setItem(ADMIN_GITHUB_TOKEN_STORAGE_KEY, token)
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}#/admin`,
  )

  return token
}

function getSiteHomeHref() {
  if (typeof window === 'undefined') {
    return SITE_HASH_ROUTE
  }

  const pathname =
    window.location.pathname.replace(/\/admin\/?$/, '/') || '/'
  const normalizedPathname = pathname.endsWith('/') ? pathname : `${pathname}/`

  return `${window.location.origin}${normalizedPathname}#/`
}

function AdminSection({
  icon,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="admin-card">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-4">
          <div className="admin-icon">{icon}</div>
          <div className="space-y-2">
            <h2 className="admin-section-title">{title}</h2>
            <p className="admin-section-copy">{description}</p>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 size-6 shrink-0 text-brand transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? <div className="mt-6 space-y-6">{children}</div> : null}
    </section>
  )
}

function FieldStack({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-3">
      <Label className="text-foreground">{label}</Label>
      {children}
      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <Label className="text-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          className="h-16 w-16 shrink-0 cursor-pointer rounded-[6px] border border-brand/30 bg-black p-2"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#000000 ou rgba(...)"
        />
      </div>
    </div>
  )
}

function AccordionBlock({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string
  description: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="admin-accordion">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <div className="space-y-2">
          <h3 className="admin-subtitle text-left">{title}</h3>
          <p className="admin-field-hint">{description}</p>
        </div>
        <ChevronDown
          className={`mt-1 size-5 shrink-0 text-brand transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? <div className="mt-5 space-y-6">{children}</div> : null}
    </section>
  )
}

function ImageField({
  label,
  value,
  onChange,
  onUploadClick,
  hint,
  alt,
  variant,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onUploadClick: () => void
  hint?: string
  alt: string
  variant: 'icon' | 'wide'
}) {
  const previewUrl = resolvePublicAssetUrl(value)

  return (
    <div className="space-y-3">
      <Label className="text-foreground">{label}</Label>
      <div className="admin-preview-frame">
        <div
          className={
            variant === 'icon'
              ? 'grid size-20 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-brand/16 bg-black/40'
              : 'min-w-0 overflow-hidden rounded-[8px] border border-brand/16 bg-black/40'
          }
        >
          {previewUrl ? (
            variant === 'icon' ? (
              <img
                src={previewUrl}
                alt={alt}
                className="size-full object-cover"
              />
            ) : (
              <div className="aspect-[1.91/1] w-full">
                <img
                  src={previewUrl}
                  alt={alt}
                  className="size-full object-cover"
                />
              </div>
            )
          ) : (
            <div
              className={
                variant === 'icon'
                  ? 'px-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-foreground-muted'
                  : 'grid aspect-[1.91/1] place-items-center px-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-foreground-muted'
              }
            >
              Sem imagem
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="./imagem.png, https://... ou data URL"
          />
          <Button type="button" variant="outline" onClick={onUploadClick}>
            <ImagePlus className="size-5" />
            Substituir imagem
          </Button>
        </div>
      </div>
      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  )
}

function AdminPage() {
  const {
    database,
    currentConfig,
    isAdminAuthenticated,
    saveCurrentConfig,
    importDatabase,
    resetDatabase,
    signIn,
    signOut,
    publishedUrl,
  } = useSiteConfig()
  const [draftConfig, setDraftConfig] = useState(() => cloneSiteConfig(currentConfig))
  const [isDirty, setIsDirty] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [githubToken, setGithubToken] = useState(() => getStoredGithubToken())
  const [loginValues, setLoginValues] = useState({
    username: '',
    password: '',
  })
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const faviconInputRef = useRef<HTMLInputElement | null>(null)
  const ogImageInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDraftConfig(cloneSiteConfig(currentConfig))
    setIsDirty(false)
  }, [currentConfig])

  useEffect(() => {
    const seededToken = seedGithubTokenFromHash()

    if (!seededToken) {
      return
    }

    setGithubToken(seededToken)
    setFeedback(
      'Publicação automática configurada neste navegador com a chave privada do painel.',
    )
  }, [])

  function updateDraft(mutator: (nextConfig: typeof draftConfig) => void) {
    setDraftConfig((current) => {
      const next = cloneSiteConfig(current)
      mutator(next)
      return next
    })
    setIsDirty(true)
    setFeedback('')
  }

  function buildDatabaseSnapshot() {
    return syncDatabaseWithCurrentConfig(database, draftConfig)
  }

  function handleDiscard() {
    setDraftConfig(cloneSiteConfig(currentConfig))
    setIsDirty(false)
    setFeedback('Rascunho descartado. O painel voltou ao último estado salvo localmente.')
  }

  function handleExport() {
    const fileContents = JSON.stringify(buildDatabaseSnapshot(), null, 2)
    const blob = new Blob([fileContents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'site-admin-db.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const raw = await file.text()
    const result = importDatabase(raw)

    setFeedback(
      result.ok
        ? 'JSON importado com sucesso. A nova versão já está ativa localmente e pode ser publicada pelo botão Salvar e publicar.'
        : result.error ?? 'Não foi possível importar o JSON informado.',
    )
    event.target.value = ''
  }

  function handleResetDatabase() {
    resetDatabase()
    setFeedback('Base local restaurada para o conteúdo padrão do projeto.')
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    applyValue: (value: string) => void,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const dataUrl = await readFileAsDataUrl(file)
    applyValue(dataUrl)
    event.target.value = ''
  }

  async function handleFaviconUpload(event: ChangeEvent<HTMLInputElement>) {
    await handleImageUpload(event, (value) =>
      updateDraft((next) => {
        next.branding.faviconUrl = value
      }),
    )
  }

  async function handleOgImageUpload(event: ChangeEvent<HTMLInputElement>) {
    await handleImageUpload(event, (value) =>
      updateDraft((next) => {
        next.seo.ogImage = value
      }),
    )
  }

  async function publishDatabase(nextDatabase: SiteDatabase, token: string) {
    const { owner, repo, branch, path } = GITHUB_PUBLISH_TARGET
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const getResponse = await fetch(
      `${baseUrl}?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (getResponse.status !== 404 && !getResponse.ok) {
      throw new Error(
        `Não foi possível ler o JSON remoto (${getResponse.status}).`,
      )
    }

    const currentFile =
      getResponse.status === 404
        ? null
        : ((await getResponse.json()) as { sha: string })

    const putResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update site admin database - ${new Date().toISOString()}`,
        content: encodeBase64Unicode(JSON.stringify(nextDatabase, null, 2)),
        branch,
        ...(currentFile?.sha ? { sha: currentFile.sha } : {}),
      }),
    })

    if (!putResponse.ok) {
      throw new Error(
        `O GitHub recusou a atualização (${putResponse.status}).`,
      )
    }
  }

  async function handleSaveAndPublish() {
    const token = githubToken.trim()

    if (!token) {
      setFeedback(
        'A publicação automática não está configurada neste navegador. Por segurança, o token não fica exposto na interface nem no código público.',
      )
      return
    }

    const nextDatabase = buildDatabaseSnapshot()

    saveCurrentConfig(draftConfig)
    setIsDirty(false)
    setIsPublishing(true)
    setFeedback('')

    try {
      await publishDatabase(nextDatabase, token)
      setFeedback(
        'Alterações salvas neste navegador e publicadas no GitHub. O GitHub Pages deve refletir a nova versão após o próximo deploy automático.',
      )
    } catch (error) {
      setFeedback(
        `${
          error instanceof Error
            ? error.message
            : 'Falha ao publicar o JSON no GitHub.'
        } As alterações ficaram salvas localmente, mas a versão compartilhada não foi atualizada.`,
      )
    } finally {
      setIsPublishing(false)
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const success = signIn(loginValues.username.trim(), loginValues.password)

    if (!success) {
      setLoginError('Login inválido. Confira o usuário e a senha fixos.')
      return
    }

    setLoginError('')
  }

  const siteHomeHref = getSiteHomeHref()

  if (!isAdminAuthenticated) {
    return (
      <div className="ambient-grid min-h-screen bg-background text-foreground">
        <main className="layout-shell flex min-h-screen items-center py-10">
          <section className="admin-card mx-auto w-full max-w-[460px] space-y-8">
            <div className="space-y-4">
              <p className="section-eyebrow">Painel</p>
              <h1 className="display-title text-[clamp(2.8rem,11vw,4.6rem)] text-foreground">
                ADM
              </h1>
              <p className="admin-section-copy">
                Acesso local para editar textos, imagens, snippets, SEO e cores
                da landing.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <FieldStack label="Usuário">
                <Input
                  value={loginValues.username}
                  onChange={(event) =>
                    setLoginValues((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  placeholder="admin"
                />
              </FieldStack>

              <FieldStack label="Senha">
                <Input
                  type="password"
                  value={loginValues.password}
                  onChange={(event) =>
                    setLoginValues((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="••••••••"
                />
              </FieldStack>

              {loginError ? (
                <p className="rounded-[4px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {loginError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3">
                <Button type="submit" size="lg" className="w-full">
                  <LockKeyhole className="size-5" />
                  Entrar no painel
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <a href={siteHomeHref}>Voltar ao site</a>
                </Button>
              </div>
            </form>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="ambient-grid min-h-screen bg-background text-foreground">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />
      <input
        ref={faviconInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFaviconUpload}
      />
      <input
        ref={ogImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOgImageUpload}
      />

      <main className="layout-shell py-6 sm:py-8">
        <section className="admin-card space-y-6">
          <div className="space-y-4">
            <p className="section-eyebrow">Painel mobile-first</p>
            <h1 className="display-title text-[clamp(3.1rem,11vw,5.4rem)] text-foreground">
              Configuração da landing
            </h1>
            <p className="admin-section-copy">
              Edite textos, branding, imagens, snippets, cores e SEO sem
              backend. Neste projeto com GitHub Pages, o botão Salvar e
              publicar aplica a mudança no navegador atual e atualiza o JSON
              compartilhado do site.
            </p>
          </div>

          <div className="admin-inline-grid">
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href={siteHomeHref}>Ver site publicado</a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="size-5" />
              Sair
            </Button>
          </div>

          <div className="rounded-[8px] border border-brand/20 bg-black/30 px-4 py-4 text-sm leading-relaxed text-foreground-muted">
            URL atual: <span className="text-foreground">{publishedUrl}</span>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <AdminSection
            icon={<FileJson className="size-5" />}
            title="Base JSON e recuperação"
            description="Ferramentas locais para importar, exportar e restaurar a base atual do site."
          >
            <div className="admin-button-grid">
              <Button type="button" variant="outline" onClick={handleExport}>
                <Download className="size-5" />
                Exportar JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => importInputRef.current?.click()}
              >
                <FileJson className="size-5" />
                Importar JSON
              </Button>
              <Button type="button" variant="outline" onClick={handleResetDatabase}>
                Restaurar base
              </Button>
            </div>
          </AdminSection>

          <AdminSection
            icon={<Globe className="size-5" />}
            title="Branding e SEO"
            description="Defina título, imagens, metadados e Open Graph sem expor opções mais técnicas no painel."
          >
            <div className="admin-form-grid">
              <FieldStack label="Título do site">
                <Input
                  value={draftConfig.branding.siteTitle}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.branding.siteTitle = event.target.value
                      next.seo.title = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Nome da marca">
                <Input
                  value={draftConfig.branding.brandName}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.branding.brandName = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Subtítulo da marca">
                <Input
                  value={draftConfig.branding.brandSubtitle}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.branding.brandSubtitle = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Canonical / URL principal">
                <Input
                  value={draftConfig.seo.canonicalUrl}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.canonicalUrl = event.target.value
                    })
                  }
                  placeholder="https://seudominio.com/"
                />
              </FieldStack>
            </div>

            <ImageField
              label="Favicon"
              value={draftConfig.branding.faviconUrl}
              onChange={(value) =>
                updateDraft((next) => {
                  next.branding.faviconUrl = value
                })
              }
              onUploadClick={() => faviconInputRef.current?.click()}
              hint="Você pode usar caminho público, URL externa ou substituir com upload."
              alt="Preview do favicon"
              variant="icon"
            />

            <div className="space-y-6">
              <FieldStack label="Meta title">
                <Input
                  value={draftConfig.seo.title}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.title = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Meta description">
                <Textarea
                  className="min-h-32"
                  value={draftConfig.seo.description}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.description = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Keywords">
                <Textarea
                  className="min-h-28"
                  value={draftConfig.seo.keywords}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.keywords = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <div className="space-y-6">
              <FieldStack label="Open Graph title">
                <Input
                  value={draftConfig.seo.ogTitle}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.ogTitle = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Open Graph description">
                <Textarea
                  className="min-h-32"
                  value={draftConfig.seo.ogDescription}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.ogDescription = event.target.value
                    })
                  }
                />
              </FieldStack>

              <ImageField
                label="Open Graph image"
                value={draftConfig.seo.ogImage}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.seo.ogImage = value
                  })
                }
                onUploadClick={() => ogImageInputRef.current?.click()}
                hint="Essa imagem aparece em compartilhamentos e cards sociais."
                alt="Preview da Open Graph image"
                variant="wide"
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={<Palette className="size-5" />}
            title="Cores do site"
            description="As variáveis abaixo controlam a identidade visual principal da landing e do botão de WhatsApp."
          >
            <div className="admin-form-grid">
              <ColorField
                label="Background"
                value={draftConfig.colors.background}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.background = value
                    next.seo.themeColor = value
                  })
                }
              />
              <ColorField
                label="Surface"
                value={draftConfig.colors.surface}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.surface = value
                  })
                }
              />
              <ColorField
                label="Surface strong"
                value={draftConfig.colors.surfaceStrong}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.surfaceStrong = value
                  })
                }
              />
              <ColorField
                label="Foreground"
                value={draftConfig.colors.foreground}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.foreground = value
                  })
                }
              />
              <ColorField
                label="Foreground muted"
                value={draftConfig.colors.foregroundMuted}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.foregroundMuted = value
                  })
                }
              />
              <ColorField
                label="Brand"
                value={draftConfig.colors.brand}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.brand = value
                  })
                }
              />
              <ColorField
                label="Brand foreground"
                value={draftConfig.colors.brandForeground}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.brandForeground = value
                  })
                }
              />
              <ColorField
                label="Border"
                value={draftConfig.colors.border}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.border = value
                  })
                }
              />
              <ColorField
                label="Ring"
                value={draftConfig.colors.ring}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.ring = value
                  })
                }
              />
              <ColorField
                label="WhatsApp"
                value={draftConfig.colors.whatsapp}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.whatsapp = value
                  })
                }
              />
              <ColorField
                label="WhatsApp foreground"
                value={draftConfig.colors.whatsappForeground}
                onChange={(value) =>
                  updateDraft((next) => {
                    next.colors.whatsappForeground = value
                  })
                }
              />
            </div>
          </AdminSection>

          <AdminSection
            icon={<Settings2 className="size-5" />}
            title="Cabeçalho, hero e painel lateral"
            description="Controle os textos principais do topo, CTAs e mensagens que ajudam na conversão."
          >
            <div className="admin-form-grid">
              <FieldStack label="CTA do header">
                <Input
                  value={draftConfig.header.ctaLabel}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.header.ctaLabel = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Eyebrow do hero">
                <Input
                  value={draftConfig.hero.eyebrow}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.eyebrow = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <div className="admin-form-grid">
              <FieldStack label="Hero linha 1">
                <Input
                  value={draftConfig.hero.titleLineOne}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.titleLineOne = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Hero linha 2">
                <Input
                  value={draftConfig.hero.titleLineTwo}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.titleLineTwo = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Hero destaque">
                <Input
                  value={draftConfig.hero.titleHighlight}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.titleHighlight = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <FieldStack label="Descrição do hero">
              <Textarea
                className="min-h-32"
                value={draftConfig.hero.description}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.hero.description = event.target.value
                  })
                }
              />
            </FieldStack>

            <div className="admin-form-grid">
              <FieldStack label="CTA primário">
                <Input
                  value={draftConfig.hero.primaryCtaLabel}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.primaryCtaLabel = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="CTA secundário">
                <Input
                  value={draftConfig.hero.secondaryCtaLabel}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.hero.secondaryCtaLabel = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <div className="admin-form-grid">
              <FieldStack label="Eyebrow do painel">
                <Input
                  value={draftConfig.sidePanel.eyebrow}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.sidePanel.eyebrow = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Valor de resposta">
                <Input
                  value={draftConfig.sidePanel.responseValue}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.sidePanel.responseValue = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <FieldStack label="Descrição do painel lateral">
              <Textarea
                className="min-h-32"
                value={draftConfig.sidePanel.responseDescription}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.sidePanel.responseDescription = event.target.value
                  })
                }
              />
            </FieldStack>

            <div className="admin-form-grid">
              {draftConfig.sidePanel.tags.map((tag, index) => (
                <FieldStack key={`${tag}-${index}`} label={`Tag ${index + 1}`}>
                  <Input
                    value={tag}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.sidePanel.tags[index] = event.target.value
                      })
                    }
                  />
                </FieldStack>
              ))}
            </div>

            <FieldStack label="Nota inferior do painel">
              <Textarea
                className="min-h-32"
                value={draftConfig.sidePanel.footerNote}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.sidePanel.footerNote = event.target.value
                  })
                }
              />
            </FieldStack>
          </AdminSection>

          <AdminSection
            icon={<Settings2 className="size-5" />}
            title="Métricas, serviços e processo"
            description="Edite a faixa numérica, os blocos de serviços e o passo a passo exibido na landing."
          >
            <div className="space-y-6">
              <h3 className="admin-subtitle">Métricas</h3>
              <div className="admin-form-grid">
                {draftConfig.metrics.map((metric, index) => (
                  <div
                    key={`${metric.label}-${index}`}
                    className="rounded-[8px] border border-brand/14 bg-black/25 p-4 space-y-4"
                  >
                    <FieldStack label={`Métrica ${index + 1} · valor`}>
                      <Input
                        value={metric.value}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.metrics[index].value = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                    <FieldStack label={`Métrica ${index + 1} · rótulo`}>
                      <Input
                        value={metric.label}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.metrics[index].label = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Seção de serviços</h3>
              <div className="admin-form-grid">
                <FieldStack label="Eyebrow">
                  <Input
                    value={draftConfig.servicesSection.eyebrow}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.servicesSection.eyebrow = event.target.value
                      })
                    }
                  />
                </FieldStack>
                <FieldStack label="Título">
                  <Input
                    value={draftConfig.servicesSection.title}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.servicesSection.title = event.target.value
                      })
                    }
                  />
                </FieldStack>
              </div>
              <FieldStack label="Descrição">
                <Textarea
                  className="min-h-28"
                  value={draftConfig.servicesSection.description}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.servicesSection.description = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Cards de serviço</h3>
              <div className="space-y-4">
                {draftConfig.services.map((service, index) => (
                  <div
                    key={`${service.number}-${index}`}
                    className="rounded-[8px] border border-brand/14 bg-black/25 p-4 space-y-4"
                  >
                    <div className="admin-form-grid">
                      <FieldStack label="Número">
                        <Input
                          value={service.number}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.services[index].number = event.target.value
                            })
                          }
                        />
                      </FieldStack>
                      <FieldStack label="Título">
                        <Input
                          value={service.title}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.services[index].title = event.target.value
                            })
                          }
                        />
                      </FieldStack>
                    </div>
                    <FieldStack label="Descrição">
                      <Textarea
                        className="min-h-28"
                        value={service.description}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.services[index].description = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Seção de processo</h3>
              <div className="admin-form-grid">
                <FieldStack label="Eyebrow">
                  <Input
                    value={draftConfig.processSection.eyebrow}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.processSection.eyebrow = event.target.value
                      })
                    }
                  />
                </FieldStack>
                <FieldStack label="Título">
                  <Input
                    value={draftConfig.processSection.title}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.processSection.title = event.target.value
                      })
                    }
                  />
                </FieldStack>
              </div>
              <FieldStack label="Descrição">
                <Textarea
                  className="min-h-28"
                  value={draftConfig.processSection.description}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.processSection.description = event.target.value
                    })
                  }
                />
              </FieldStack>

              <div className="space-y-4">
                {draftConfig.processSteps.map((step, index) => (
                  <div
                    key={`${step.number}-${index}`}
                    className="rounded-[8px] border border-brand/14 bg-black/25 p-4 space-y-4"
                  >
                    <div className="admin-form-grid">
                      <FieldStack label="Número">
                        <Input
                          value={step.number}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.processSteps[index].number = event.target.value
                            })
                          }
                        />
                      </FieldStack>
                      <FieldStack label="Título">
                        <Input
                          value={step.title}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.processSteps[index].title = event.target.value
                            })
                          }
                        />
                      </FieldStack>
                    </div>
                    <FieldStack label="Descrição">
                      <Textarea
                        className="min-h-28"
                        value={step.description}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.processSteps[index].description =
                              event.target.value
                          })
                        }
                      />
                    </FieldStack>
                  </div>
                ))}
              </div>
            </div>
          </AdminSection>

          <AdminSection
            icon={<FileJson className="size-5" />}
            title="Contato, formulário, footer e snippets"
            description="Controle o número de WhatsApp, a seção de orçamento, os campos do formulário e os textos finais da página."
          >
            <div className="space-y-4">
              <AccordionBlock
                title="Contato"
                description="Dados principais de contato usados na landing e no envio para o WhatsApp."
              >
                <div className="admin-form-grid">
                  <FieldStack label="Número do WhatsApp">
                    <Input
                      value={draftConfig.contact.whatsappNumber}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.contact.whatsappNumber = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Número exibido">
                    <Input
                      value={draftConfig.contact.whatsappDisplay}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.contact.whatsappDisplay = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                </div>
                <FieldStack label="Mensagem padrão do WhatsApp">
                  <Textarea
                    className="min-h-28"
                    value={draftConfig.contact.defaultMessage}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.contact.defaultMessage = event.target.value
                      })
                    }
                  />
                </FieldStack>
              </AccordionBlock>

              <AccordionBlock
                title="Seção de orçamento"
                description="Textos do bloco amarelo e do CTA principal do formulário."
              >
                <div className="admin-form-grid">
                  <FieldStack label="Eyebrow">
                    <Input
                      value={draftConfig.quoteSection.eyebrow}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.quoteSection.eyebrow = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Título">
                    <Input
                      value={draftConfig.quoteSection.title}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.quoteSection.title = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                </div>
                <FieldStack label="Descrição">
                  <Textarea
                    className="min-h-28"
                    value={draftConfig.quoteSection.description}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.quoteSection.description = event.target.value
                      })
                    }
                  />
                </FieldStack>
                <FieldStack label="Texto de apoio">
                  <Textarea
                    className="min-h-28"
                    value={draftConfig.quoteSection.supportText}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.quoteSection.supportText = event.target.value
                      })
                    }
                  />
                </FieldStack>

                <div className="admin-form-grid">
                  <FieldStack label="Texto do botão">
                    <Input
                      value={draftConfig.quoteSection.submitLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.quoteSection.submitLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Texto auxiliar">
                    <Input
                      value={draftConfig.quoteSection.helperText}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.quoteSection.helperText = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                </div>
              </AccordionBlock>

              <AccordionBlock
                title="Campos do formulário"
                description="Labels, placeholders, opções do select e mensagens de validação."
              >
                <div className="admin-form-grid">
                  <FieldStack label="Label nome">
                    <Input
                      value={draftConfig.form.nameLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.nameLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Placeholder nome">
                    <Input
                      value={draftConfig.form.namePlaceholder}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.namePlaceholder = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Label telefone">
                    <Input
                      value={draftConfig.form.phoneLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.phoneLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Placeholder telefone">
                    <Input
                      value={draftConfig.form.phonePlaceholder}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.phonePlaceholder = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Label serviço">
                    <Input
                      value={draftConfig.form.serviceLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.serviceLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Placeholder serviço">
                    <Input
                      value={draftConfig.form.servicePlaceholder}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.servicePlaceholder = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Label bairro / cidade">
                    <Input
                      value={draftConfig.form.locationLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.locationLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Placeholder bairro / cidade">
                    <Input
                      value={draftConfig.form.locationPlaceholder}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.locationPlaceholder = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Label detalhes">
                    <Input
                      value={draftConfig.form.detailsLabel}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.detailsLabel = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                  <FieldStack label="Placeholder detalhes">
                    <Input
                      value={draftConfig.form.detailsPlaceholder}
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.form.detailsPlaceholder = event.target.value
                        })
                      }
                    />
                  </FieldStack>
                </div>

                <div className="space-y-4">
                  <h4 className="admin-subtitle">Opções do select de serviço</h4>
                  <div className="admin-form-grid">
                    {draftConfig.form.serviceOptions.map((option, index) => (
                      <FieldStack key={`${option}-${index}`} label={`Opção ${index + 1}`}>
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.form.serviceOptions[index] = event.target.value
                            })
                          }
                        />
                      </FieldStack>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="admin-subtitle">Mensagens de validação</h4>
                  <div className="admin-form-grid">
                    <FieldStack label="Nome obrigatório">
                      <Input
                        value={draftConfig.form.validationNameRequired}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.form.validationNameRequired = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                    <FieldStack label="Telefone obrigatório">
                      <Input
                        value={draftConfig.form.validationPhoneRequired}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.form.validationPhoneRequired = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                    <FieldStack label="Serviço obrigatório">
                      <Input
                        value={draftConfig.form.validationServiceRequired}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.form.validationServiceRequired = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                    <FieldStack label="Detalhes obrigatórios">
                      <Input
                        value={draftConfig.form.validationDetailsRequired}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.form.validationDetailsRequired = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                    <FieldStack label="Fallback da localização">
                      <Input
                        value={draftConfig.form.locationNotProvidedLabel}
                        onChange={(event) =>
                          updateDraft((next) => {
                            next.form.locationNotProvidedLabel = event.target.value
                          })
                        }
                      />
                    </FieldStack>
                  </div>
                </div>
              </AccordionBlock>
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Footer</h3>
              <div className="admin-form-grid">
                <FieldStack label="Prefixo do WhatsApp">
                  <Input
                    value={draftConfig.footer.whatsappLabelPrefix}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.footer.whatsappLabelPrefix = event.target.value
                      })
                    }
                  />
                </FieldStack>
                <FieldStack label="Texto legal">
                  <Input
                    value={draftConfig.footer.legalText}
                    onChange={(event) =>
                      updateDraft((next) => {
                        next.footer.legalText = event.target.value
                      })
                    }
                  />
                </FieldStack>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Snippets</h3>
              <FieldStack
                label="Head snippet"
                hint="Use para Google Tag Manager, pixels ou metas customizadas no head."
              >
                <Textarea
                  className="min-h-40 font-mono text-sm tracking-normal"
                  value={draftConfig.snippets.head}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.snippets.head = event.target.value
                    })
                  }
                  placeholder="<script>...</script>"
                />
              </FieldStack>
              <FieldStack
                label="Body snippet"
                hint="Use para noscript do GTM, widgets ou integrações que precisam entrar no body."
              >
                <Textarea
                  className="min-h-40 font-mono text-sm tracking-normal"
                  value={draftConfig.snippets.body}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.snippets.body = event.target.value
                    })
                  }
                  placeholder="<noscript>...</noscript>"
                />
              </FieldStack>
            </div>
          </AdminSection>

          <div className="sticky bottom-4 z-20">
            <div className="admin-card border-brand/35 bg-background/92 backdrop-blur-md">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">
                  {isPublishing
                    ? 'Publicando alterações'
                    : isDirty
                      ? 'Mudanças prontas para publicar'
                      : 'Base local sincronizada'}
                </p>
                <p className="admin-field-hint">
                  {feedback ||
                    'Salve e publique para aplicar o rascunho no navegador atual e atualizar a versão compartilhada do GitHub Pages.'}
                </p>
              </div>

              <div className="mt-5 admin-button-grid">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={!isDirty || isPublishing}
                >
                  Descartar rascunho
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isPublishing}
                >
                  <Save className="size-5" />
                  {isPublishing ? 'Publicando...' : 'Salvar e publicar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPage
