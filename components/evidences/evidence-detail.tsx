'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EvidenceDomains } from './evidence-domains'
import { EvidenceScreenshots } from './evidence-screenshots'
import type { EvidenceDetailWithKeyword } from '@/lib/hooks/use-evidence-detail'

interface EvidenceDetailProps {
  evidence: EvidenceDetailWithKeyword | null
  isLoading: boolean
  error: string | null
}

export function EvidenceDetail({
  evidence,
  isLoading,
  error,
}: EvidenceDetailProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  if (error) {
    return (
      <div className="container py-6">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/${orgSlug}/evidences`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Erro ao carregar evidência</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <Button disabled variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    )
  }

  if (!evidence) {
    return (
      <div className="container py-6">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/${orgSlug}/evidences`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Evidência não encontrada</p>
        </div>
      </div>
    )
  }

  const detectedDate = new Date(evidence.detected_at)
  const formattedDate = format(detectedDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  })

  return (
    <div className="container py-6">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/${orgSlug}/evidences`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            {evidence.is_positive ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {evidence.keyword?.keyword || 'Desconhecido'}
              </h1>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                evidence.is_positive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Evidência {evidence.is_positive ? 'Positiva' : 'Negativa'}
            </span>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status da Evidência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {evidence.is_positive
                ? 'Sua marca não foi encontrada em contextos negativos. Isso é uma boa notícia!'
                : `Sua marca foi encontrada em ${evidence.domains.length} domínio${evidence.domains.length !== 1 ? 's' : ''} que referenciam de forma prejudicial à sua reputação.`}
            </p>
          </CardContent>
        </Card>

        {/* Domains Section (if negative) */}
        {!evidence.is_positive && evidence.domains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Domínios que Referenciam
              </CardTitle>
              <CardDescription>
                {evidence.domains.length} domínio{evidence.domains.length !== 1 ? 's' : ''} encontrado{evidence.domains.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvidenceDomains domains={evidence.domains} />
            </CardContent>
          </Card>
        )}

        {/* Screenshots Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Screenshots das Buscas</CardTitle>
            <CardDescription>
              Prints capturados dos principais mecanismos de busca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EvidenceScreenshots screenshots={evidence.screenshots} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
