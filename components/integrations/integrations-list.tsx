'use client'

import { useParams } from 'next/navigation'
import { IntegrationCard } from './integration-card'

const INTEGRATIONS_CONFIG = [
  {
    name: 'Google Ads',
    description: 'Monitore e analise suas campanhas do Google Ads',
    icon: '🔎',
    connected: false,
    slug: 'google-ads',
  },
  {
    name: 'Meta Ads',
    description: 'Gerencie suas campanhas do Meta (Facebook & Instagram)',
    icon: '📘',
    connected: false,
    slug: 'meta-ads',
  },
  {
    name: 'Bing Ads',
    description: 'Integre suas campanhas do Microsoft Bing Ads',
    icon: '🔵',
    connected: false,
    slug: 'bing-ads',
  },
]

export function IntegrationsList() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INTEGRATIONS_CONFIG.map((integration) => (
        <IntegrationCard
          key={integration.slug}
          name={integration.name}
          description={integration.description}
          icon={integration.icon}
          connected={integration.connected}
          href={`/${orgSlug}/integrations/${integration.slug}`}
        />
      ))}
    </div>
  )
}
