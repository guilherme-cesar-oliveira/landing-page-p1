import { useEffect, useState } from 'react'

import { SiteConfigProvider } from '@/lib/site-config-context'
import { useSiteConfig } from '@/lib/use-site-config'
import AdminPage from '@/pages/AdminPage'
import Index from '@/pages/Index'

function getRouteFromLocation(pathname: string, hash: string) {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'

  if (
    hash.startsWith('#/admin') ||
    normalizedPathname === '/admin' ||
    normalizedPathname.endsWith('/admin')
  ) {
    return 'admin'
  }

  return 'site'
}

function AppRouter() {
  const { isReady } = useSiteConfig()
  const [route, setRoute] = useState(() =>
    getRouteFromLocation(window.location.pathname, window.location.hash),
  )

  useEffect(() => {
    function syncRouteFromLocation() {
      setRoute(getRouteFromLocation(window.location.pathname, window.location.hash))
    }

    window.addEventListener('hashchange', syncRouteFromLocation)
    window.addEventListener('popstate', syncRouteFromLocation)

    return () => {
      window.removeEventListener('hashchange', syncRouteFromLocation)
      window.removeEventListener('popstate', syncRouteFromLocation)
    }
  }, [])

  if (!isReady) {
    return (
      <div className="ambient-grid flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
        <div className="admin-card max-w-md space-y-4">
          <p className="section-eyebrow">Carregando</p>
          <h1 className="display-title text-[clamp(2.8rem,10vw,4.6rem)] text-foreground">
            Preparando a landing
          </h1>
          <p className="admin-section-copy">
            Buscando a configuração, os presets e o estado salvo neste
            navegador.
          </p>
        </div>
      </div>
    )
  }

  return route === 'admin' ? <AdminPage /> : <Index />
}

function App() {
  return (
    <SiteConfigProvider>
      <AppRouter />
    </SiteConfigProvider>
  )
}

export default App
