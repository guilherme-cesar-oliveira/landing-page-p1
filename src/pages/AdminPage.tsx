import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Download,
  FileJson,
  Globe,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Palette,
  Save,
  Settings2,
  ShieldAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ADMIN_PUBLISH_SETTINGS_STORAGE_KEY,
  SITE_HASH_ROUTE,
  cloneSiteConfig,
  cloneSiteDatabase,
} from '@/lib/site-config'
import { useSiteConfig } from '@/lib/use-site-config'

type PublishSettings = {
  owner: string
  repo: string
  branch: string
  path: string
}

const DEFAULT_PUBLISH_SETTINGS: PublishSettings = {
  owner: 'guilherme-cesar-oliveira',
  repo: 'landing-page-p1',
  branch: 'main',
  path: 'public/site-admin-db.json',
}

function encodeBase64Unicode(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function AdminSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="admin-card space-y-6">
      <div className="flex items-start gap-4">
        <div className="admin-icon">{icon}</div>
        <div className="space-y-2">
          <h2 className="admin-section-title">{title}</h2>
          <p className="admin-section-copy">{description}</p>
        </div>
      </div>
      {children}
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

function AdminPage() {
  const {
    database,
    currentConfig,
    isAdminAuthenticated,
    saveCurrentConfig,
    applyPreset,
    createPreset,
    deletePreset,
    importDatabase,
    resetDatabase,
    signIn,
    signOut,
    publishedUrl,
  } = useSiteConfig()
  const [draftConfig, setDraftConfig] = useState(() => cloneSiteConfig(currentConfig))
  const [isDirty, setIsDirty] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState(database.currentPresetId)
  const [presetName, setPresetName] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loginError, setLoginError] = useState('')
  const [publishFeedback, setPublishFeedback] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [publishSettings, setPublishSettings] = useState<PublishSettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_PUBLISH_SETTINGS
    }

    try {
      const raw = window.localStorage.getItem(ADMIN_PUBLISH_SETTINGS_STORAGE_KEY)

      if (!raw) {
        return DEFAULT_PUBLISH_SETTINGS
      }

      return {
        ...DEFAULT_PUBLISH_SETTINGS,
        ...(JSON.parse(raw) as Partial<PublishSettings>),
      }
    } catch {
      return DEFAULT_PUBLISH_SETTINGS
    }
  })
  const [loginValues, setLoginValues] = useState({
    username: '',
    password: '',
  })
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const faviconInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDraftConfig(cloneSiteConfig(currentConfig))
    setSelectedPresetId(database.currentPresetId)
    setIsDirty(false)
  }, [currentConfig, database.currentPresetId])

  useEffect(() => {
    window.localStorage.setItem(
      ADMIN_PUBLISH_SETTINGS_STORAGE_KEY,
      JSON.stringify(publishSettings),
    )
  }, [publishSettings])

  function updateDraft(mutator: (nextConfig: typeof draftConfig) => void) {
    setDraftConfig((current) => {
      const next = cloneSiteConfig(current)
      mutator(next)
      return next
    })
    setIsDirty(true)
    setFeedback('')
  }

  function handleSave() {
    saveCurrentConfig(draftConfig)
    setIsDirty(false)
    setFeedback(
      'Alterações salvas neste navegador e aplicadas ao site. Para compartilhar com todos, publique o JSON no GitHub.',
    )
  }

  function handleDiscard() {
    setDraftConfig(cloneSiteConfig(currentConfig))
    setIsDirty(false)
    setFeedback('Rascunho descartado. O site voltou ao estado salvo.')
  }

  function handleExport() {
    const nextDatabase = cloneSiteDatabase(database)
    nextDatabase.currentConfig = cloneSiteConfig(draftConfig)
    nextDatabase.updatedAt = new Date().toISOString()
    const fileContents = JSON.stringify(nextDatabase, null, 2)
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
        ? 'JSON importado com sucesso. As novas configurações já estão ativas.'
        : result.error ?? 'Não foi possível importar o JSON.',
    )
    event.target.value = ''
  }

  async function handleFaviconUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    updateDraft((next) => {
      next.branding.faviconUrl = dataUrl
    })
    event.target.value = ''
  }

  function handleApplyPreset() {
    applyPreset(selectedPresetId)
    setFeedback('Preset aplicado. Revise e salve se quiser continuar editando.')
  }

  function handleCreatePreset() {
    const trimmedName = presetName.trim()

    if (!trimmedName) {
      setFeedback('Dê um nome ao preset antes de salvar.')
      return
    }

    createPreset(trimmedName, draftConfig)
    setPresetName('')
    setIsDirty(false)
    setFeedback('Preset salvo com sucesso nesta base local.')
  }

  function handleDeletePreset() {
    if (selectedPresetId === 'default') {
      setFeedback('O preset padrão não pode ser removido.')
      return
    }

    deletePreset(selectedPresetId)
    setFeedback('Preset removido.')
  }

  function handleResetDatabase() {
    resetDatabase()
    setFeedback('Banco local restaurado para o preset base do projeto.')
  }

  function buildPublishableDatabase() {
    const nextDatabase = cloneSiteDatabase(database)
    nextDatabase.updatedAt = new Date().toISOString()
    nextDatabase.currentPresetId = selectedPresetId
    nextDatabase.currentConfig = cloneSiteConfig(draftConfig)

    const presetIndex = nextDatabase.presets.findIndex(
      (preset) => preset.id === selectedPresetId,
    )

    if (presetIndex >= 0) {
      nextDatabase.presets[presetIndex] = {
        ...nextDatabase.presets[presetIndex],
        config: cloneSiteConfig(draftConfig),
      }
    }

    return nextDatabase
  }

  async function handlePublishToGithub() {
    if (
      !publishSettings.owner.trim() ||
      !publishSettings.repo.trim() ||
      !publishSettings.branch.trim() ||
      !publishSettings.path.trim()
    ) {
      setPublishFeedback(
        'Preencha owner, repositório, branch e caminho do JSON antes de publicar.',
      )
      return
    }
    if (!githubToken.trim()) {
      setPublishFeedback(
        'Informe um token do GitHub com permissão de escrita no repositório antes de publicar.',
      )
      return
    }

    const nextDatabase = buildPublishableDatabase()
    const content = JSON.stringify(nextDatabase, null, 2)
    const token = githubToken.trim()
    const owner = publishSettings.owner.trim()
    const repo = publishSettings.repo.trim()
    const branch = publishSettings.branch.trim()
    const path = publishSettings.path.trim()
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

    setIsPublishing(true)
    setPublishFeedback('')

    try {
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
          content: encodeBase64Unicode(content),
          branch,
          ...(currentFile?.sha ? { sha: currentFile.sha } : {}),
        }),
      })

      if (!putResponse.ok) {
        throw new Error(
          `O GitHub recusou a atualização (${putResponse.status}).`,
        )
      }

      saveCurrentConfig(draftConfig)
      setIsDirty(false)
      setPublishFeedback(
        'JSON publicado no GitHub com sucesso. O GitHub Pages deve refletir a nova versão após o próximo deploy automático.',
      )
    } catch (error) {
      setPublishFeedback(
        error instanceof Error
          ? error.message
          : 'Falha ao publicar o JSON no GitHub.',
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

  if (!isAdminAuthenticated) {
    return (
      <div className="ambient-grid min-h-screen bg-background text-foreground">
        <main className="layout-shell flex min-h-screen items-center py-10">
          <section className="admin-card mx-auto w-full max-w-[460px] space-y-8">
            <div className="space-y-4">
              <p className="section-eyebrow">Painel</p>
              <h1 className="display-title text-[clamp(2.8rem,11vw,4.6rem)] text-foreground">
                Administração básica
              </h1>
              <p className="admin-section-copy">
                Acesso local para editar textos, SEO, snippets, favicon e cores
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
                  <a href={SITE_HASH_ROUTE}>Voltar ao site</a>
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

      <main className="layout-shell py-6 sm:py-8">
        <section className="admin-card space-y-6">
          <div className="space-y-4">
            <p className="section-eyebrow">Painel mobile-first</p>
            <h1 className="display-title text-[clamp(3.1rem,11vw,5.4rem)] text-foreground">
              Configuração da landing
            </h1>
            <p className="admin-section-copy">
              Edite textos, branding, cores, snippets e SEO sem backend.
              Como esta instalação roda em GitHub Pages, o rascunho pode ficar
              salvo neste navegador e a versão compartilhada pode ser
              publicada atualizando o JSON do projeto no GitHub.
            </p>
          </div>

          <div className="admin-inline-grid">
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href={SITE_HASH_ROUTE}>Ver site publicado</a>
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
            icon={<Settings2 className="size-5" />}
            title="Presets e persistência"
            description="Gerencie o JSON base, crie predefinições locais e leve a configuração para outro navegador ou projeto."
          >
            <div className="admin-form-grid">
              <FieldStack
                label="Preset salvo"
                hint="Aplique um preset salvo para substituir o conteúdo atual do site."
              >
                <Select
                  value={selectedPresetId}
                  onValueChange={setSelectedPresetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {database.presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldStack>

              <FieldStack
                label="Nome do novo preset"
                hint="Salva uma foto do estado atual da landing dentro da base JSON local."
              >
                <Input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Ex: Clínica dourado claro"
                />
              </FieldStack>
            </div>

            <div className="admin-button-grid">
              <Button type="button" variant="outline" onClick={handleApplyPreset}>
                Aplicar preset
              </Button>
              <Button type="button" variant="outline" onClick={handleCreatePreset}>
                Salvar como preset
              </Button>
              <Button type="button" variant="outline" onClick={handleDeletePreset}>
                Remover preset
              </Button>
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
            title="Publicação compartilhada"
            description="Para que outras pessoas vejam as alterações, publique o JSON no repositório e deixe o GitHub Pages refletir a nova versão."
          >
            <div className="rounded-[10px] border border-brand/20 bg-black/30 px-4 py-4 text-sm leading-relaxed text-foreground-muted">
              O botão abaixo atualiza o arquivo{' '}
              <span className="text-foreground">site-admin-db.json</span> no
              GitHub. Isso transforma a edição local do painel em uma
              configuração compartilhada para os próximos visitantes do site.
            </div>

            <div className="admin-form-grid">
              <FieldStack label="Owner">
                <Input
                  value={publishSettings.owner}
                  onChange={(event) =>
                    setPublishSettings((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                />
              </FieldStack>

              <FieldStack label="Repositório">
                <Input
                  value={publishSettings.repo}
                  onChange={(event) =>
                    setPublishSettings((current) => ({
                      ...current,
                      repo: event.target.value,
                    }))
                  }
                />
              </FieldStack>

              <FieldStack label="Branch">
                <Input
                  value={publishSettings.branch}
                  onChange={(event) =>
                    setPublishSettings((current) => ({
                      ...current,
                      branch: event.target.value,
                    }))
                  }
                />
              </FieldStack>

              <FieldStack label="Caminho do JSON no repo">
                <Input
                  value={publishSettings.path}
                  onChange={(event) =>
                    setPublishSettings((current) => ({
                      ...current,
                      path: event.target.value,
                    }))
                  }
                />
              </FieldStack>
            </div>

            <FieldStack
              label="Token GitHub"
              hint="Use um token pessoal com permissão de escrita no repositório. Ele fica apenas nesta sessão do painel."
            >
              <Input
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder="ghp_... ou github_pat_..."
              />
            </FieldStack>

            <div className="admin-button-grid">
              <Button
                type="button"
                onClick={handlePublishToGithub}
                disabled={isPublishing}
              >
                {isPublishing ? 'Publicando...' : 'Publicar JSON no GitHub'}
              </Button>
            </div>

            {publishFeedback ? (
              <p className="rounded-[8px] border border-brand/18 bg-black/30 px-4 py-3 text-sm leading-relaxed text-foreground">
                {publishFeedback}
              </p>
            ) : null}
          </AdminSection>

          <AdminSection
            icon={<ShieldAlert className="size-5" />}
            title="Domínio e aviso de suporte"
            description="Ajustes de domínio não são feitos neste painel."
          >
            <div className="rounded-[10px] border border-brand/25 bg-brand/10 px-4 py-4 text-sm leading-relaxed text-foreground">
              Para mudar o domínio publicado, entre em contato com o suporte.
              Essa alteração é um serviço pago e não fica disponível para
              autoatendimento neste painel.
            </div>
            <FieldStack
              label="Canonical / URL principal"
              hint="Esse campo controla SEO. Ele não troca o domínio real do GitHub Pages."
            >
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
          </AdminSection>

          <AdminSection
            icon={<Globe className="size-5" />}
            title="Branding e SEO"
            description="Defina título, favicon, metadados, Open Graph e configurações que afetam busca e compartilhamento."
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

              <FieldStack label="Locale">
                <Input
                  value={draftConfig.branding.locale}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.branding.locale = event.target.value
                    })
                  }
                />
              </FieldStack>
            </div>

            <div className="admin-form-grid">
              <FieldStack
                label="Favicon (URL ou data URL)"
                hint="Você também pode subir um arquivo abaixo."
              >
                <Input
                  value={draftConfig.branding.faviconUrl}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.branding.faviconUrl = event.target.value
                    })
                  }
                />
              </FieldStack>

              <div className="space-y-3">
                <Label className="text-foreground">Subir favicon</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  <ImagePlus className="size-5" />
                  Escolher arquivo
                </Button>
              </div>
            </div>

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

            <div className="admin-form-grid">
              <FieldStack label="Robots">
                <Input
                  value={draftConfig.seo.robots}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.robots = event.target.value
                    })
                  }
                />
              </FieldStack>

              <FieldStack label="Twitter card">
                <Input
                  value={draftConfig.seo.twitterCard}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.twitterCard = event.target.value
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

              <FieldStack label="Open Graph image">
                <Input
                  value={draftConfig.seo.ogImage}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.seo.ogImage = event.target.value
                    })
                  }
                />
              </FieldStack>
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
            description="Controle número de WhatsApp, labels do formulário, integração por snippets e os textos finais da página."
          >
            <div className="space-y-6">
              <h3 className="admin-subtitle">Contato</h3>
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
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Seção de orçamento</h3>
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
            </div>

            <div className="space-y-6">
              <h3 className="admin-subtitle">Campos do formulário</h3>
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
                  {isDirty
                    ? 'Mudanças não salvas'
                    : 'Tudo salvo no navegador atual'}
                </p>
                <p className="admin-field-hint">
                  {feedback ||
                    'Salve para aplicar ao site e manter o estado local. Exporte o JSON para levar as predefinições para outro ambiente.'}
                </p>
              </div>

              <div className="mt-5 admin-button-grid">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={!isDirty}
                >
                  Descartar rascunho
                </Button>
                <Button type="button" onClick={handleSave}>
                  <Save className="size-5" />
                  Salvar alterações
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
