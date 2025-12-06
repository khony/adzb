import { z } from "zod"

export const inviteSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  role: z.enum(['admin', 'member'], {
    message: "Selecione uma role",
  }),
})

export type InviteInput = z.infer<typeof inviteSchema>
