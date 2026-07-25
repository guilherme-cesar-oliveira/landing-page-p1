import { type FormEvent, useRef, useState } from 'react'
import {
  ArrowDown,
  Hammer,
  MessageCircleMore,
  PhoneCall,
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
  buildQuoteWhatsAppUrl,
  type QuoteFormValues,
} from '@/lib/quote'
import { useSiteConfig } from '@/lib/use-site-config'
import { cn } from '@/lib/utils'

const initialFormValues: QuoteFormValues = {
  name: '',
  phone: '',
  service: '',
  location: '',
  details: '',
}

function BrandMark({
  brandName,
  brandSubtitle,
  className,
}: {
  brandName: string
  brandSubtitle: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="grid size-12 shrink-0 place-items-center border border-brand/90 bg-black/35 text-brand shadow-[0_18px_42px_-28px_rgba(217,171,67,0.78)] sm:size-13">
        <svg
          viewBox="0 0 48 48"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 22.5 24 10l16 12.5" />
          <path d="M13 20v18h22V20" />
          <path d="m18 28 5 5" />
          <path d="m23 28-5 5" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="display-wordmark text-[2.15rem] text-foreground">
          {brandName}
        </p>
        <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.46em] text-foreground-muted sm:text-xs">
          {brandSubtitle}
        </p>
      </div>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{description}</p>
    </div>
  )
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ''
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function Index() {
  const { currentConfig, genericWhatsAppUrl } = useSiteConfig()
  const servicesRef = useRef<HTMLElement | null>(null)
  const quoteRef = useRef<HTMLElement | null>(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof QuoteFormValues, string>>
  >({})

  function scrollToSection(section: 'services' | 'quote') {
    const target = section === 'services' ? servicesRef.current : quoteRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function validate(values: QuoteFormValues) {
    const nextErrors: Partial<Record<keyof QuoteFormValues, string>> = {}

    if (!values.name.trim()) {
      nextErrors.name = currentConfig.form.validationNameRequired
    }

    if (!values.phone.trim()) {
      nextErrors.phone = currentConfig.form.validationPhoneRequired
    }

    if (!values.service.trim()) {
      nextErrors.service = currentConfig.form.validationServiceRequired
    }

    if (!values.details.trim()) {
      nextErrors.details = currentConfig.form.validationDetailsRequired
    }

    return nextErrors
  }

  function updateField<K extends keyof QuoteFormValues>(
    field: K,
    value: QuoteFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }))

    setFormErrors((current) => {
      if (!current[field]) {
        return current
      }

      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    openExternalUrl(buildQuoteWhatsAppUrl(formValues, currentConfig))
  }

  return (
    <div className="ambient-grid min-h-screen bg-background text-foreground">
      <header className="border-b border-brand/80 bg-background/95 shadow-[0_20px_50px_-42px_rgba(217,171,67,0.5)] backdrop-blur-sm">
        <div className="layout-shell flex items-center justify-between gap-4 py-4 sm:py-5">
          <BrandMark
            brandName={currentConfig.branding.brandName}
            brandSubtitle={currentConfig.branding.brandSubtitle}
          />
          <Button asChild variant="gold" className="gold-glow h-12 px-5">
            <a href={genericWhatsAppUrl} target="_blank" rel="noreferrer">
              {currentConfig.header.ctaLabel}
            </a>
          </Button>
        </div>
      </header>

      <main className="relative">
        <section className="relative overflow-hidden border-b border-brand/80">
          <div className="absolute left-[-9%] top-[16%] h-40 w-40 rounded-full bg-white/[0.04] blur-3xl sm:h-52 sm:w-52" />
          <div className="absolute right-[-12%] top-[-2%] h-56 w-56 rounded-full bg-brand/18 blur-3xl sm:h-72 sm:w-72" />

          <div className="layout-shell grid gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end lg:gap-16 lg:py-20">
            <div className="reveal-up max-w-[660px] space-y-8">
              <p className="section-eyebrow">{currentConfig.hero.eyebrow}</p>
              <h1 className="display-hero text-[clamp(4.4rem,20vw,8.7rem)] text-foreground">
                <span className="block">{currentConfig.hero.titleLineOne}</span>
                <span className="block">{currentConfig.hero.titleLineTwo}</span>
                <span className="block text-brand">
                  {currentConfig.hero.titleHighlight}
                </span>
              </h1>

              <p className="hero-copy max-w-xl">
                {currentConfig.hero.description}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                <Button
                  type="button"
                  size="lg"
                  className="gold-glow-strong w-full sm:w-auto"
                  onClick={() => scrollToSection('quote')}
                >
                  <MessageCircleMore className="size-5" />
                  {currentConfig.hero.primaryCtaLabel}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => scrollToSection('services')}
                >
                  {currentConfig.hero.secondaryCtaLabel}
                  <ArrowDown className="size-5" />
                </Button>
              </div>
            </div>

            <aside className="reveal-up reveal-delay-1 relative">
              <div className="premium-panel border border-brand/40 px-6 py-7 sm:px-8 sm:py-8">
                <div className="flex items-center justify-between gap-4 border-b border-brand/20 pb-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.38em] text-brand">
                    {currentConfig.sidePanel.eyebrow}
                  </span>
                  <Hammer className="size-5 text-brand" />
                </div>

                <div className="space-y-6 pt-6">
                  <div>
                    <p className="display-number text-[4.5rem] text-foreground">
                      {currentConfig.sidePanel.responseValue}
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-foreground-muted">
                      {currentConfig.sidePanel.responseDescription}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {currentConfig.sidePanel.tags.map((item) => (
                      <div
                        key={item}
                        className="premium-card border border-brand/20 bg-black/30 px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <p className="border-t border-brand/20 pt-6 text-sm leading-relaxed text-foreground-muted">
                    {currentConfig.sidePanel.footerNote}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-brand text-brand-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="layout-shell grid grid-cols-3 gap-3 py-10 text-center sm:gap-6 sm:py-12">
            {currentConfig.metrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="space-y-2">
                <p className="display-number text-[clamp(3.2rem,11vw,6.3rem)]">
                  {metric.value}
                </p>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] sm:text-sm">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="services"
          ref={servicesRef}
          className="scroll-mt-6 border-b border-brand/70"
        >
          <div className="layout-shell py-14 sm:py-16 lg:py-20">
            <SectionHeading
              eyebrow={currentConfig.servicesSection.eyebrow}
              title={currentConfig.servicesSection.title}
              description={currentConfig.servicesSection.description}
            />

            <div className="mt-10 grid gap-px bg-brand/22 lg:mt-12 lg:grid-cols-2">
              {currentConfig.services.map((service) => (
                <article
                  key={service.number}
                  className="premium-card grid grid-cols-[auto_1fr] gap-5 bg-background px-0 py-8 sm:gap-8 sm:py-10"
                >
                  <div className="display-number w-[4.6rem] shrink-0 text-[4.6rem] text-brand">
                    {service.number}
                  </div>
                  <div className="space-y-3 pr-2">
                    <h3 className="display-title text-[2.5rem] text-foreground sm:text-[3rem]">
                      {service.title}
                    </h3>
                    <p className="text-lg leading-relaxed text-foreground-muted sm:text-[1.2rem]">
                      {service.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-brand/70">
          <div className="layout-shell py-14 sm:py-16 lg:py-20">
            <SectionHeading
              eyebrow={currentConfig.processSection.eyebrow}
              title={currentConfig.processSection.title}
              description={currentConfig.processSection.description}
            />

            <div className="mt-10 grid gap-px bg-brand/22 lg:mt-12 lg:grid-cols-3">
              {currentConfig.processSteps.map((step) => (
                <article
                  key={step.number}
                  className="premium-card space-y-6 bg-background px-0 py-8 sm:py-10"
                >
                  <p className="display-number text-[4.8rem] text-brand">
                    {step.number}
                  </p>
                  <div className="space-y-3">
                    <h3 className="display-title text-[2.4rem] text-foreground sm:text-[2.8rem]">
                      {step.title}
                    </h3>
                    <p className="max-w-sm text-lg leading-relaxed text-foreground-muted sm:text-[1.18rem]">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="quote"
          ref={quoteRef}
          className="scroll-mt-6 border-b border-brand/70"
        >
          <div className="layout-shell py-12 sm:py-14 lg:py-16">
            <div className="gold-glow premium-card grid gap-10 bg-brand px-5 py-8 text-brand-foreground shadow-[0_28px_80px_-44px_rgba(217,171,67,0.65)] sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-12 lg:px-12 lg:py-14">
              <div className="space-y-6 lg:space-y-8">
                <p className="section-eyebrow text-black/70">
                  {currentConfig.quoteSection.eyebrow}
                </p>
                <h2 className="display-title text-[clamp(3.45rem,9vw,6rem)] text-black">
                  {currentConfig.quoteSection.title}
                </h2>
                <p className="max-w-md text-lg leading-relaxed text-black/70 sm:text-[1.22rem]">
                  {currentConfig.quoteSection.description}
                </p>
                <div className="hidden border-t border-black/15 pt-6 lg:block">
                  <p className="max-w-sm text-base leading-relaxed text-black/65">
                    {currentConfig.quoteSection.supportText}
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name">{currentConfig.form.nameLabel}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formValues.name}
                      onChange={(event) =>
                        updateField('name', event.target.value)
                      }
                      placeholder={currentConfig.form.namePlaceholder}
                      aria-invalid={Boolean(formErrors.name)}
                    />
                    {formErrors.name ? (
                      <p className="text-sm font-semibold text-black/80">
                        {formErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone">{currentConfig.form.phoneLabel}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="tel"
                      value={formValues.phone}
                      onChange={(event) =>
                        updateField('phone', formatPhone(event.target.value))
                      }
                      placeholder={currentConfig.form.phonePlaceholder}
                      aria-invalid={Boolean(formErrors.phone)}
                    />
                    {formErrors.phone ? (
                      <p className="text-sm font-semibold text-black/80">
                        {formErrors.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="service">
                      {currentConfig.form.serviceLabel}
                    </Label>
                    <Select
                      value={formValues.service}
                      onValueChange={(value) => updateField('service', value)}
                    >
                      <SelectTrigger
                        id="service"
                        aria-invalid={Boolean(formErrors.service)}
                      >
                        <SelectValue
                          placeholder={currentConfig.form.servicePlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {currentConfig.form.serviceOptions.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.service ? (
                      <p className="text-sm font-semibold text-black/80">
                        {formErrors.service}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="location">
                      {currentConfig.form.locationLabel}
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formValues.location}
                      onChange={(event) =>
                        updateField('location', event.target.value)
                      }
                      placeholder={currentConfig.form.locationPlaceholder}
                      aria-invalid={Boolean(formErrors.location)}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="details">
                      {currentConfig.form.detailsLabel}
                    </Label>
                    <Textarea
                      id="details"
                      name="details"
                      value={formValues.details}
                      onChange={(event) =>
                        updateField('details', event.target.value)
                      }
                      placeholder={currentConfig.form.detailsPlaceholder}
                      aria-invalid={Boolean(formErrors.details)}
                    />
                    {formErrors.details ? (
                      <p className="text-sm font-semibold text-black/80">
                        {formErrors.details}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    variant="whatsapp"
                    size="lg"
                    className="whatsapp-glow w-full"
                  >
                    <MessageCircleMore className="size-5" />
                    {currentConfig.quoteSection.submitLabel}
                  </Button>
                  <p className="text-center text-sm leading-relaxed text-black/58 sm:text-base">
                    {currentConfig.quoteSection.helperText}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand/70 bg-background">
        <div className="layout-shell flex flex-col items-start gap-6 py-10 pb-24 text-left sm:py-12 sm:pb-14">
          <BrandMark
            brandName={currentConfig.branding.brandName}
            brandSubtitle={currentConfig.branding.brandSubtitle}
            className="justify-start"
          />

          <div className="space-y-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
            <a
              href={genericWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-start gap-2 text-foreground transition-colors hover:text-brand"
            >
              <PhoneCall className="size-4" />
              {currentConfig.footer.whatsappLabelPrefix}{' '}
              {currentConfig.contact.whatsappDisplay}
            </a>
            <p>{currentConfig.footer.legalText}</p>
          </div>
        </div>
      </footer>

      <Button
        asChild
        variant="whatsapp"
        size="icon"
        className="whatsapp-glow fixed bottom-4 right-4 z-30 size-16 border-4 border-background transition-transform duration-300 hover:scale-[1.03] lg:bottom-8 lg:right-8"
      >
        <a
          href={genericWhatsAppUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${currentConfig.footer.whatsappLabelPrefix} ${currentConfig.contact.whatsappDisplay}`}
        >
          <MessageCircleMore className="size-7" />
        </a>
      </Button>
    </div>
  )
}

export default Index
