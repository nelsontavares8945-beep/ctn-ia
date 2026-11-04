# CTN.IA

Assistente web Next.js: chat OpenAI, análise de fotos/documentos, sessão anônima com histórico PostgreSQL, painel administrativo e estúdio de prévia musical em WAV.

## Rodar localmente

Requisitos: Node.js 20+ e npm. Configure `.env.local` (copie `.env.example`) com `OPENAI_API_KEY`, `AUTH_SECRET` (segredo aleatório de 32+ caracteres) e `DATABASE_URL` PostgreSQL.

```bash
npm install
cp .env.example .env.local
# edite .env.local com os valores secretos
npx prisma db push
npm run dev
```

No Windows PowerShell, copie com `Copy-Item .env.example .env.local`. Acesse `http://localhost:3000`. Depois de mudar variáveis, reinicie o servidor.

## Banco PostgreSQL

Crie um banco PostgreSQL gerenciado (por exemplo, Neon) e configure `DATABASE_URL` com a URL SSL fornecida pelo provedor. Depois execute `npx prisma db push` para criar a tabela `Activity`. Para ambientes maiores, configure Prisma migrations e pooler do provedor em vez de usar `db push` como fluxo de evolução de schema.

O histórico é separado por cookie de sessão assinado e HTTP-only, limitado aos 100 registros recentes por sessão. Chat, documentos, fotos e letras são guardados no PostgreSQL; imagens binárias e arquivos enviados não são armazenados. A sessão de visitante não é login de usuário, sincroniza apenas no mesmo navegador/cookie e não deve ser tratada como conta pessoal. Configure retenção/backup do banco conforme sua necessidade.

## Áudio musical

O estúdio está em `/music`. A OpenAI cria letra, acordes e guia textual; o servidor sintetiza uma prévia instrumental simples em WAV a partir dos acordes, que pode ser ouvida e baixada. Não é vocal cantado nem produção musical de estúdio; para isso seria preciso contratar e integrar um provedor dedicado de áudio, configurando sua própria chave no servidor.

## Deploy na Vercel

O código está preparado para build na Vercel, mas a publicação final precisa ser executada na sua conta — não posso configurar credenciais ou criar o banco por você.

1. Crie um PostgreSQL gerenciado e copie a URL SSL.
2. Importe `nelsontavares8945-beep/ctn-ia` na Vercel como projeto Next.js.
3. Em **Settings → Environment Variables**, defina `OPENAI_API_KEY`, `MODEL`, `APP_NAME`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `DATABASE_URL` para Production (e Preview/Development se necessário). Nunca use a chave que foi enviada no chat; revogue-a e crie uma nova.
4. Gere `AUTH_SECRET` aleatório, use senha administrativa exclusiva, e não compartilhe segredos.
5. Antes do primeiro deploy com banco vazio, execute `npx prisma db push` localmente com o `DATABASE_URL` de produção. Para fazer isso sem salvar segredos no repositório, defina a variável somente no terminal/ambiente local. Alternativamente use uma pipeline de deploy segura.
6. Faça deploy/redeploy na Vercel. Em seguida abra `/admin/login`, `/history` e `/music` no domínio para verificar os recursos.

O deploy não foi realizado automaticamente: requer acesso à sua conta Vercel, banco e segredos privados. A API OpenAI é cobrada conforme uso e configuração de faturamento. Monitore limites e custos.

## Limites e segurança

- A aplicação não garante respostas sempre certas nem navegação web atualizada.
- PDFs escaneados precisam de OCR; arquivos aceitos nesta versão: PDF, DOCX e TXT, até 10 MB.
- Use HTTPS, credenciais fortes e revise as regras de retenção antes de guardar informações sensíveis. Registros anônimos não substituem autenticação de usuário.
- `OPENAI_API_KEY`, `AUTH_SECRET`, senha e URL do banco são segredos de servidor. Nunca use `NEXT_PUBLIC_` nesses valores nem publique `.env.local`.
