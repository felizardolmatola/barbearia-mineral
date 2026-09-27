# Mineral Barber

Aplicação web para agendamento da Mineral Barber, construída como uma
plataforma simples em React (SPA), sem servidor próprio.

## Stack

- React 19
- TypeScript
- React Router (SPA)
- Vite
- Tailwind CSS v4
- Supabase (autenticação, base de dados e tempo real, chamado directamente do browser)

## Desenvolvimento local

Requisitos: Node.js 20+ e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

A aplicação de desenvolvimento fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

Configure as variáveis do `.env.example` no ambiente de execução.

- `VITE_SUPABASE_URL`: URL pública do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave pública/publishable do Supabase.

Como a aplicação já não tem servidor próprio, não são necessárias variáveis
de servidor nem a `SUPABASE_SERVICE_ROLE_KEY` — todo o acesso aos dados passa
pelas políticas de RLS do Supabase, usando a chave pública.

Na Vercel, configure essas variáveis em **Project Settings → Environment Variables**.

## Build e validação

```bash
npm run typecheck
npm run build
npm run lint
```

`npm run build` gera ficheiros estáticos em `dist/`.

## Deploy na Vercel

O projeto é uma SPA estática. O `vercel.json` define uma reescrita para que
qualquer rota (`/auth`, `/gestao`, etc.) sirva `index.html`, deixando o React
Router tratar da navegação no cliente.

## Estrutura das páginas

- `/` — Agendamento público (`src/pages/Home.tsx`)
- `/auth` — Entrada da equipa (`src/pages/Auth.tsx`)
- `/gestao` — Painel de gestão, protegido por `RequireAuth`
  (`src/pages/Gestao.tsx`, `src/components/layout/RequireAuth.tsx`)

## Banco de dados

O frontend usa o projeto Supabase configurado nas variáveis de ambiente.
Publicar o código no GitHub ou fazer novo deploy na Vercel não apaga os
dados do Supabase.

As migrações SQL ficam em `drizzle/migrations/` para referência e
versionamento do banco.

## WhatsApp

O número do cliente usa o prefixo `+258` e o campo aceita somente números
inteiros do telefone local.

## Segurança

Nunca faça commit de:

- `.env`
- `.env.local`
- tokens privados
- credenciais administrativas
