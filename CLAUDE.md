# ADZB Frontend

Sistema de monitoramento de marca e proteção contra uso indevido de palavras-chave em plataformas de anúncios.

## Stack Tecnológica

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **Backend/Auth**: Supabase
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Datas**: date-fns

## Estrutura do Projeto

```
app/
├── (auth)/                    # Rotas de autenticação
│   ├── login/
│   ├── register/
│   └── onboarding/
├── (dashboard)/               # Rotas do dashboard (protegidas)
│   ├── [orgSlug]/             # Rotas específicas da organização
│   │   ├── dashboard/         # Dashboard com estatísticas
│   │   ├── keywords/          # Gerenciamento de palavras-chave
│   │   ├── evidences/         # Lista e detalhes de evidências
│   │   ├── negotiations/      # Gerenciamento de negociações
│   │   ├── integrations/      # Integrações com plataformas de ads
│   │   └── settings/          # Configurações da organização
│   ├── profile/               # Perfil do usuário
│   └── invitations/[token]/   # Aceitar convites
components/
├── auth/                      # Componentes de autenticação
├── dashboard/                 # Componentes do dashboard
├── evidences/                 # Componentes de evidências
├── integrations/              # Componentes de integrações
├── keywords/                  # Componentes de palavras-chave
├── layout/                    # Sidebar, navegação, menus
├── negotiations/              # Componentes de negociações
├── organizations/             # Membros, convites, configurações
├── profile/                   # Formulário de perfil
├── providers/                 # Context providers
└── ui/                        # Componentes base (shadcn/ui)
lib/
├── actions/                   # Server actions
├── hooks/                     # Custom hooks
├── supabase/                  # Cliente Supabase
├── types/                     # Tipos TypeScript
└── validations/               # Schemas de validação (Zod)
```

## Funcionalidades Implementadas

### Autenticação
- [x] Login com email/senha
- [x] Registro de novos usuários
- [x] Onboarding (criação da primeira organização)
- [x] Proteção de rotas

### Organizações
- [x] Criar organização
- [x] Editar configurações da organização
- [x] Trocar entre organizações (org switcher)
- [x] Gerenciar membros
- [x] Convidar membros por email
- [x] Aceitar convites
- [x] Revogar convites pendentes
- [x] Remover membros

### Palavras-chave
- [x] Listar palavras-chave
- [x] Criar palavra-chave
- [x] Editar palavra-chave
- [x] Deletar palavra-chave
- [x] Categorias/tags
- [x] Skeleton loading
- [x] Realtime updates via Supabase

### Evidências
- [x] Listar evidências
- [x] Filtrar por tipo (positiva/negativa)
- [x] Visualizar detalhes da evidência
- [x] Exibir domínios detectados
- [x] Exibir screenshots por engine (Google, Bing, Yahoo, Meta)
- [x] Skeleton loading
- [x] Realtime updates via Supabase

### Dashboard
- [x] Exibir nome da organização
- [x] Card: Contagem de palavras-chave (azul)
- [x] Card: Contagem de evidências (roxo)
- [x] Card: Contagem de evidências negativas (vermelho)
- [x] Card: Contagem de negociações (laranja) - aguardando tabela
- [x] Card: Contagem de categorias únicas (amarelo)
- [x] Card: Contagem de usuários ativos (verde)
- [x] Gráfico de linha: Evidências negativas dos últimos 7 dias
- [x] Skeleton loading
- [x] Cards com borda colorida à esquerda + ícone colorido

### Integrações
- [ ] Google Ads (página criada)
- [ ] Meta Ads (página criada)
- [ ] Bing Ads (página criada)
- [x] Google Search Console
  - [x] OAuth com Google
  - [x] Conectar/desconectar conta
  - [x] Armazenar tokens no banco
  - [x] Refresh token automático
  - [ ] Buscar dados da API

### Negociações
- [x] Listar negociações com filtro por status
- [x] Criar negociação manualmente
- [x] Visualizar detalhes da negociação
- [x] Gerenciar status (pendente/em andamento/resolvido/não resolvido)
- [x] Vincular evidência (opcional)
- [x] Destinatários exibidos como badges
- [x] Skeleton loading
- [x] Realtime updates via Supabase
- [x] ID como UUIDv7 (time-ordered)

### Perfil
- [x] Editar nome
- [x] Editar avatar

## Tipos Principais

```typescript
type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  userRole?: 'admin' | 'member'
}

type Keyword = {
  id: string
  organization_id: string
  keyword: string
  description: string | null
  category: string | null  // Tags separadas por vírgula
  created_by: string
  created_at: string
  updated_at: string
}

type Evidence = {
  id: string
  organization_id: string
  keyword_id: string
  is_positive: boolean
  created_at: string
  detected_at: string
}

type EvidenceDomain = {
  id: string
  evidence_id: string
  domain: string
  created_at: string
}

type EvidenceScreenshot = {
  id: string
  evidence_id: string
  engine: 'google' | 'yahoo' | 'bing' | 'meta'
  file_path: string | null
  created_at: string
}

type IntegrationProvider = 'google_search_console' | 'google_ads' | 'meta_ads' | 'bing_ads'

type Integration = {
  id: string
  organization_id: string
  provider: IntegrationProvider
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  account_id: string | null
  account_email: string | null
  account_name: string | null
  is_active: boolean
  settings: Record<string, unknown>
  connected_by: string | null
  created_at: string
  updated_at: string
}

type NegotiationStatus = 'pending' | 'in_progress' | 'resolved' | 'unresolved'

type Negotiation = {
  id: string                    // UUIDv7
  organization_id: string
  evidence_id: string | null    // Opcional
  subject: string
  content: string
  recipients: string            // Emails separados por vírgula
  status: NegotiationStatus
  created_by: string
  created_at: string
  updated_at: string
  last_interaction_at: string
}

type NegotiationAttachment = {
  id: string
  negotiation_id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}
```

## Hooks Personalizados

| Hook | Descrição |
|------|-----------|
| `useKeywords` | Lista palavras-chave com realtime |
| `useEvidences` | Lista evidências com filtros e realtime |
| `useEvidenceDetail` | Detalhes de uma evidência |
| `useNegotiations` | Lista negociações com filtros e realtime |
| `useDashboardStats` | Estatísticas do dashboard |
| `useIntegration` | Status de integração por provider |
| `useToast` | Notificações toast |

## Padrões de Código

### Skeleton Loading
Cada seção com carregamento de dados possui um componente skeleton correspondente:
- `KeywordListSkeleton`
- `EvidenceListSkeleton`
- `NegotiationListSkeleton`
- `DashboardSkeleton`

### Cards de Estatísticas
O componente `StatCard` aceita cores predefinidas:
- `blue`, `green`, `red`, `yellow`, `purple`, `orange`

A cor é aplicada como borda à esquerda (4px) e no ícone.

### Realtime
Hooks que usam realtime do Supabase:
- `useKeywords` - canal `keywords:{organizationId}`
- `useEvidences` - canal `evidences:{organizationId}`
- `useNegotiations` - canal `negotiations:{organizationId}`

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (para integrações)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Próximos Passos

1. Implementar upload de anexos para negociações
2. Implementar integrações com plataformas de ads
3. Adicionar mais filtros na lista de evidências
4. Implementar exportação de relatórios
5. Adicionar notificações em tempo real
6. Adicionar contagem de negociações no dashboard
