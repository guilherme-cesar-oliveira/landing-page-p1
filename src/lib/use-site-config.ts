import { useContext } from 'react'

import { SiteConfigContext } from '@/lib/site-config-context'

export function useSiteConfig() {
  const context = useContext(SiteConfigContext)

  if (!context) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider')
  }

  return context
}
