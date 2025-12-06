# Supabase Database Setup

Este diretório contém as migrations SQL para configurar o banco de dados da aplicação.

## Como Executar as Migrations

### 1. Acesse o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/rawioemqztwuznctzcvq
2. Faça login com sua conta Supabase
3. Navegue até **SQL Editor** no menu lateral

### 2. Execute as Migrations na Ordem

#### Migration 001: Schema Inicial

1. Abra o arquivo `migrations/001_initial_schema.sql`
2. Copie todo o conteúdo
3. No SQL Editor do Supabase, cole o SQL
4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)
5. Aguarde a execução completar

Esta migration cria:
- ✅ Tipos ENUM (member_role, invitation_status)
- ✅ Tabelas (profiles, organizations, organization_members, invitations, keywords)
- ✅ Índices para performance
- ✅ Functions PostgreSQL (create_organization_with_admin, accept_invitation, etc.)
- ✅ Triggers (auto-create profile, auto-update timestamps)
- ✅ Row Level Security (RLS) policies para todas as tabelas

#### Migration 002: Storage para Avatars

1. Abra o arquivo `migrations/002_storage_avatars.sql`
2. Copie todo o conteúdo
3. No SQL Editor do Supabase, cole o SQL
4. Clique em **Run**
5. Aguarde a execução completar

Esta migration cria:
- ✅ Bucket `avatars` no Supabase Storage (público)
- ✅ Policies de acesso para upload/delete de avatars

### 3. Configurações Adicionais no Dashboard

#### Desabilitar Confirmação de Email

1. Navegue até **Authentication** > **Providers** no menu lateral
2. Clique em **Email**
3. Desmarque a opção **"Confirm email"**
4. Clique em **Save**

Isso permite que usuários façam login imediatamente após o registro, sem precisar confirmar o email.

#### Verificar Storage Bucket

1. Navegue até **Storage** no menu lateral
2. Você deve ver o bucket **avatars** listado
3. Clique nele para verificar que está configurado como **Public**

### 4. Gerar Tipos TypeScript (Opcional mas Recomendado)

Para ter type-safety completo, gere os tipos TypeScript do banco:

```bash
npx supabase gen types typescript --project-id rawioemqztwuznctzcvq > types/database.types.ts
```

**Nota**: Você precisará do Supabase CLI instalado e autenticado.

## Estrutura do Banco de Dados

### Tabelas

```
profiles              - Perfis de usuários (estende auth.users)
organizations         - Organizações/Tenants
organization_members  - Membros das organizações (many-to-many)
invitations          - Convites pendentes
keywords             - Palavras-chave por organização
```

### Multi-Tenancy

O isolamento de dados é garantido via **Row Level Security (RLS)**:
- Cada query é automaticamente filtrada pelas policies
- Usuários só veem dados de organizações das quais são membros
- Admins têm permissões adicionais (convidar, remover membros, etc.)

### Storage

Estrutura de pastas no bucket `avatars`:
```
avatars/
├── users/
│   └── {user_id}/
│       └── avatar.jpg
└── organizations/
    └── {org_id}/
        └── logo.jpg
```

## Próximos Passos

Após executar as migrations:

1. ✅ Configure a confirmação de email (desabilitar)
2. ✅ Execute a aplicação Next.js: `npm run dev`
3. ✅ Teste o registro de um novo usuário
4. ✅ Verifique se o perfil foi criado automaticamente
5. ✅ Teste criar uma organização no onboarding

## Troubleshooting

### Erro: "relation already exists"

Se você receber este erro, significa que a tabela/índice já existe. Você pode:
- Ignorar o erro se for uma re-execução
- Ou dropar as tabelas primeiro (⚠️ CUIDADO: isso apaga todos os dados)

### Erro: "permission denied"

Certifique-se de que você está executando o SQL como o usuário postgres/admin do projeto no Supabase Dashboard.

### Testar RLS Policies

Para testar se as policies estão funcionando:

```sql
-- No SQL Editor, rode como um usuário específico
SELECT auth.uid(); -- Verifica qual usuário você está usando

-- Teste ver organizações
SELECT * FROM organizations;

-- Teste criar uma organização (deve falhar se você não for o created_by)
INSERT INTO organizations (name, slug, created_by)
VALUES ('Test Org', 'test-org', 'some-other-user-id');
```

## Suporte

Em caso de problemas, verifique:
1. Logs no Supabase Dashboard > Logs
2. Mensagens de erro no SQL Editor
3. Policies de RLS estão habilitadas: `SELECT * FROM pg_policies;`
