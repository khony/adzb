'use client'

import { IntegrationsList } from '@/components/integrations/integrations-list'

export default function IntegrationsPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte seus serviços de publicidade para sincronizar dados
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Plataformas de Publicidade</h2>
        <IntegrationsList />
      </div>
    </div>
  )
}
