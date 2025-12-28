'use client'

import { useEffect, useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { negotiationSchema, type NegotiationInput } from '@/lib/validations/negotiation'
import { createNegotiation, updateNegotiation } from '@/lib/actions/negotiations'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Negotiation } from '@/lib/types'
import { Upload, X } from 'lucide-react'

interface EvidenceOption {
  id: string
  keyword: string
  detected_at: string
}

interface NegotiationFormProps {
  organizationId: string
  negotiation?: Negotiation
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NegotiationForm({
  organizationId,
  negotiation,
  open,
  onOpenChange,
  onSuccess,
}: NegotiationFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [evidences, setEvidences] = useState<EvidenceOption[]>([])
  const [loadingEvidences, setLoadingEvidences] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<NegotiationInput>({
    resolver: zodResolver(negotiationSchema),
    defaultValues: {
      subject: '',
      content: '',
      recipients: '',
      evidence_id: null,
    },
  })

  // Fetch evidences for select
  useEffect(() => {
    if (!open || !organizationId) return

    async function fetchEvidences() {
      setLoadingEvidences(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('evidences')
        .select('id, detected_at, keywords(keyword)')
        .eq('organization_id', organizationId)
        .order('detected_at', { ascending: false })
        .limit(100)

      if (data) {
        setEvidences(
          data.map((e: any) => ({
            id: e.id,
            keyword: Array.isArray(e.keywords) ? e.keywords[0]?.keyword : e.keywords?.keyword,
            detected_at: e.detected_at,
          }))
        )
      }
      setLoadingEvidences(false)
    }

    fetchEvidences()
  }, [open, organizationId])

  // Update form when negotiation changes (for edit mode)
  useEffect(() => {
    if (negotiation) {
      form.reset({
        subject: negotiation.subject,
        content: negotiation.content,
        recipients: negotiation.recipients,
        evidence_id: negotiation.evidence_id,
      })
    } else {
      form.reset({
        subject: '',
        content: '',
        recipients: '',
        evidence_id: null,
      })
    }
  }, [negotiation, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: NegotiationInput) {
    const formData = new FormData()
    formData.append('subject', values.subject)
    formData.append('content', values.content)
    formData.append('recipients', values.recipients)
    formData.append('evidence_id', values.evidence_id || '')

    // Adicionar anexos ao FormData
    attachments.forEach((file) => {
      formData.append('attachments', file)
    })

    startTransition(async () => {
      const result = negotiation
        ? await updateNegotiation(negotiation.id, formData)
        : await createNegotiation(organizationId, formData)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: negotiation ? 'Negociação atualizada' : 'Negociação criada e email enviado',
        })
        onOpenChange(false)
        form.reset()
        setAttachments([])
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{negotiation ? 'Editar' : 'Nova'} Negociação</DialogTitle>
          <DialogDescription>
            {negotiation
              ? 'Atualize as informações da negociação'
              : 'Crie uma nova negociação para sua organização'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Assunto da negociação"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatários</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email1@exemplo.com, email2@exemplo.com"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Separe múltiplos emails por vírgula
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidence_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidência (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value || 'none'}
                    disabled={isPending || loadingEvidences}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma evidência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma evidência</SelectItem>
                      {evidences.map((evidence) => (
                        <SelectItem key={evidence.id} value={evidence.id}>
                          {evidence.keyword} -{' '}
                          {new Date(evidence.detected_at).toLocaleDateString('pt-BR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os detalhes da negociação..."
                      className="min-h-[150px] resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!negotiation && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Anexos (opcional)</label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Adicionar Anexos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {attachments.length > 0 && (
                    <div className="space-y-1">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border p-2 text-sm"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
