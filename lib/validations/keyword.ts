import { z } from "zod"

export const keywordSchema = z.object({
  keyword: z
    .string()
    .min(1, { message: "Keyword é obrigatória" })
    .max(100, { message: "Keyword deve ter no máximo 100 caracteres" }),
  description: z
    .string()
    .max(500, { message: "Descrição deve ter no máximo 500 caracteres" })
    .optional(),
  category: z
    .string()
    .max(50, { message: "Categoria deve ter no máximo 50 caracteres" })
    .optional(),
})

export type KeywordInput = z.infer<typeof keywordSchema>
