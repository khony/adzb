import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendNegotiationEmailParams {
  negotiationId: string
  organizationId: string
}

export async function sendNegotiationEmail({
  negotiationId,
  organizationId,
}: SendNegotiationEmailParams) {
  try {
    const supabase = await createClient()

    // Buscar negociação com anexos
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiations')
      .select(
        `
        *,
        negotiation_attachments(*)
      `
      )
      .eq('id', negotiationId)
      .single()

    if (negotiationError || !negotiation) {
      console.error('Negociação não encontrada:', negotiationError)
      return { success: false, error: 'Negociação não encontrada' }
    }

    // Buscar informações da organização
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    const organizationName = organization?.name || 'Organização'

    // Separar destinatários (emails separados por vírgula)
    const recipients = negotiation.recipients
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0)

    if (recipients.length === 0) {
      return { success: false, error: 'Nenhum destinatário válido encontrado' }
    }

    // Buscar anexos do Supabase Storage se existirem
    const attachments = []
    if (negotiation.negotiation_attachments && negotiation.negotiation_attachments.length > 0) {
      for (const attachment of negotiation.negotiation_attachments) {
        try {
          // Baixar arquivo do Supabase Storage
          const { data: fileData } = await supabase.storage
            .from('negotiation-attachments')
            .download(attachment.file_path)

          if (fileData) {
            // Converter para base64
            const buffer = await fileData.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')

            attachments.push({
              filename: attachment.file_name,
              content: base64,
            })
          }
        } catch (error) {
          console.error(`Erro ao baixar anexo ${attachment.file_name}:`, error)
        }
      }
    }

    // Formatar o corpo do email
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    .message { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${negotiation.subject}</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${organizationName}</p>
    </div>
    <div class="content">
      <div class="message">
        ${negotiation.content}
      </div>
      ${
        attachments.length > 0
          ? `
      <p style="margin-top: 20px; color: #6b7280;">
        📎 Este email contém ${attachments.length} anexo(s)
      </p>
      `
          : ''
      }
    </div>
    <div class="footer">
      <p>Esta é uma comunicação automática do sistema Adspika.</p>
      <p>Por favor, não responda a este email.</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Enviar email via Resend
    const emailData: any = {
      from: 'Adspika <noreply@adspika.com>',
      to: recipients,
      subject: negotiation.subject,
      html: emailBody,
    }

    // Adicionar anexos se existirem
    if (attachments.length > 0) {
      emailData.attachments = attachments
    }

    const { data: emailResult, error: emailError } = await resend.emails.send(emailData)

    if (emailError) {
      console.error('Erro ao enviar email:', emailError)
      return { success: false, error: 'Erro ao enviar email', details: emailError }
    }

    return {
      success: true,
      emailId: emailResult?.id,
      recipientsCount: recipients.length,
    }
  } catch (error) {
    console.error('Erro ao enviar email de negociação:', error)
    return {
      success: false,
      error: 'Erro interno ao enviar email',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
