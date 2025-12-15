import { z } from "zod"

export const negotiationSchema = z.object({
  subject: z
    .string()
    .min(1, { message: "Assunto é obrigatório" })
    .max(200, { message: "Assunto deve ter no máximo 200 caracteres" }),
  content: z
    .string()
    .min(1, { message: "Conteúdo é obrigatório" })
    .max(10000, { message: "Conteúdo deve ter no máximo 10000 caracteres" }),
  recipients: z
    .string()
    .min(1, { message: "Pelo menos um destinatário é obrigatório" })
    .refine(
      (val) => {
        const emails = val.split(",").map((e) => e.trim()).filter(Boolean)
        if (emails.length === 0) return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emails.every((email) => emailRegex.test(email))
      },
      { message: "Todos os emails devem ser válidos" }
    ),
  evidence_id: z.string().uuid().optional().nullable(),
})

export const updateNegotiationSchema = negotiationSchema.partial().extend({
  status: z.enum(["pending", "in_progress", "resolved", "unresolved"]).optional(),
})

export type NegotiationInput = z.infer<typeof negotiationSchema>
export type UpdateNegotiationInput = z.infer<typeof updateNegotiationSchema>
