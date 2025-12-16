'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'

export default function GoogleAdsIntegrationPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  return (
    <div className="container py-6">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/${orgSlug}/integrations`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Google Ads</h1>
        <p className="text-muted-foreground">
          Configure a integração com Google Ads
        </p>
      </div>
    </div>
  )
}
