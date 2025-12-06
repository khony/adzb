'use client'

import { ExternalLink } from 'lucide-react'
import type { EvidenceDomain } from '@/lib/types'

interface EvidenceDomainsProps {
  domains: EvidenceDomain[]
}

export function EvidenceDomains({ domains }: EvidenceDomainsProps) {
  if (domains.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Domínios que Referenciam</h3>
      <div className="grid gap-2">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium break-all">{domain.domain}</span>
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Abrir domínio"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
