'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, Loader2, LogOut, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useActiveOrg } from '@/contexts/active-org-context'
import { useIntegration } from '@/lib/hooks/use-integration'
import { useToast } from '@/lib/hooks/use-toast'
import {
  generateGoogleAuthUrl,
  disconnectIntegration,
} from '@/lib/actions/integrations'

export default function GoogleSearchConsoleIntegrationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string
  const { activeOrg } = useActiveOrg()
  const { toast } = useToast()

  const { integration, isConnected, isLoading, refetch } = useIntegration(
    activeOrg?.id,
    'google_search_console'
  )

  const [isPending, startTransition] = useTransition()
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  // Show success message if redirected from OAuth
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Conectado com sucesso',
        description: 'Google Search Console foi conectado a sua organizacao',
      })
      refetch()
    }
    if (searchParams.get('error')) {
      toast({
        title: 'Erro na conexao',
        description: searchParams.get('error'),
        variant: 'destructive',
      })
    }
  }, [searchParams, toast, refetch])

  const handleConnect = () => {
    if (!activeOrg) return

    startTransition(async () => {
      const result = await generateGoogleAuthUrl(activeOrg.id, 'google_search_console')

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      if (result.data) {
        window.location.href = result.data
      }
    })
  }

  const handleDisconnect = () => {
    if (!activeOrg) return

    startTransition(async () => {
      const result = await disconnectIntegration(activeOrg.id, 'google_search_console')

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Desconectado',
          description: 'Google Search Console foi desconectado',
        })
        refetch()
      }

      setShowDisconnectDialog(false)
    })
  }

  const isAdmin = activeOrg?.userRole === 'admin'

  return (
    <div className="container py-6">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/${orgSlug}/integrations`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Google Search Console</h1>
        <p className="text-muted-foreground">
          Monitore a presenca do seu site nos resultados de busca do Google
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Conexao</CardTitle>
            <CardDescription>
              Conecte sua conta do Google para acessar os dados do Search Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Conectado</span>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conta</span>
                    <span className="text-sm font-medium">{integration?.account_email}</span>
                  </div>
                  {integration?.account_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nome</span>
                      <span className="text-sm font-medium">{integration.account_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conectado em</span>
                    <span className="text-sm font-medium">
                      {integration?.created_at
                        ? new Date(integration.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisconnectDialog(true)}
                    disabled={isPending}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nenhuma conta conectada. Conecte sua conta do Google para comecar a monitorar
                  seus dados do Search Console.
                </p>

                {isAdmin ? (
                  <Button onClick={handleConnect} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Conectar com Google
                  </Button>
                ) : (
                  <p className="text-sm text-yellow-600">
                    Apenas administradores podem conectar integracoes.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos Disponiveis</CardTitle>
            <CardDescription>
              O que voce pode fazer com a integracao do Google Search Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Monitorar desempenho de busca organica
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Analisar palavras-chave que geram trafego
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Verificar posicao media nos resultados
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Acompanhar impressoes e cliques
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Google Search Console?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira remover a conexao com o Google Search Console. Voce precisara
              reconectar para acessar os dados novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Desconectando...' : 'Desconectar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
