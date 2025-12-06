'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface IntegrationCardProps {
  name: string
  description: string
  icon: React.ReactNode
  connected?: boolean
  href: string
}

export function IntegrationCard({
  name,
  description,
  icon,
  connected = false,
  href,
}: IntegrationCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
            {icon}
          </div>
          {connected && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Conectado
            </span>
          )}
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant={connected ? 'outline' : 'default'}>
          <Link href={href}>
            {connected ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Gerenciar
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Conectar
              </>
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
