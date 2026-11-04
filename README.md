# CTN.IA

Aplicação web de IA com chat, voz do navegador, geração de imagens, análise de fotos, leitura de documentos e criação de propostas musicais.

## Rodar localmente

Requisitos: Node.js 20 (recomendado) e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env.local` no lugar de `cp`. Abra `http://localhost:3000`. As variáveis em `.env.local` são carregadas ao iniciar o servidor; reinicie `npm run dev` depois de alterá-las.

### Variáveis locais

Edite `.env.local` sem compartilhar ou commitar o arquivo:

```env
OPENAI_API_KEY=sua_chave_secreta
MODEL=gpt-4o-mini
APP_NAME=CTN.IA
ADMIN_EMAIL=seu-email
ADMIN_PASSWORD=uma-senha-forte
AUTH_SECRET=um-segredo-aleatorio-com-pelo-menos-32-caracteres
```

Crie uma chave OpenAI em [platform.openai.com/api-keys](https://platform.openai.com/api-keys). A conta precisa ter acesso à API e faturamento configurado. Nunca envie a chave em chats, não use prefixo `NEXT_PUBLIC_` e não a coloque no frontend nem no GitHub. Se uma chave já foi compartilhada, revogue-a e gere outra.

## Hospedar na Vercel

O projeto está preparado para deploy como aplicação Next.js na Vercel. A publicação ainda precisa ser feita na sua conta; este repositório não contém segredos de implantação.

1. Entre na [Vercel](https://vercel.com/) e importe `nelsontavares8945-beep/ctn-ia` do GitHub.
2. Mantenha o preset Next.js e a raiz do projeto padrão. A Vercel detecta os comandos de build automaticamente.
3. Em **Settings → Environment Variables**, crie `OPENAI_API_KEY`, `MODEL`, `APP_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `AUTH_SECRET`. Adicione-os aos ambientes desejados (Production, Preview e/ou Development). Não use os valores de exemplo como senha/segredo em produção.
4. Gere `AUTH_SECRET` aleatório com pelo menos 32 caracteres; use senha longa e exclusiva em `ADMIN_PASSWORD`.
5. Faça o deploy. Depois de alterar variáveis, faça um novo deploy para que entrem em vigor.
6. Abra `/admin/login` no domínio publicado. O painel confirma o estado da configuração, sem mostrar as chaves.

Para testar com variáveis de desenvolvimento da Vercel, instale a CLI e use `vercel dev`; alternativamente, mantenha `.env.local` para executar `npm run dev` localmente. HTTPS é fornecido pela Vercel no domínio publicado.

## Painel administrativo e histórico

- Acesse `/admin/login` e entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no ambiente do servidor.
- O painel `/admin` mostra status da aplicação, configuração OpenAI e instruções para configurar as variáveis.
- O histórico atual do chat e dos recursos é salvo no armazenamento local do navegador. Ele não sincroniza entre dispositivos/usuários e pode ser apagado ao limpar os dados do navegador; não é um banco de dados em nuvem.

## Recursos e limites

- Chat, análise visual, documentos, geração de imagens e letras/arranjos usam OpenAI quando a chave está configurada.
- Voz de entrada/saída usa APIs do navegador e depende de suporte e permissão do dispositivo.
- Documentos aceitos: PDF, DOCX e TXT, até 10 MB. PDFs compostos apenas por imagens precisam de OCR.
- A proposta musical é texto (letra, acordes, andamento e guia de melodia). Uma chave OpenAI não gera, por si só, uma faixa musical cantada; isso requer integração adicional com um provedor de áudio.
- Nenhuma IA garante respostas sempre certas nem informação em tempo real sem uma integração de busca atualizada.
- As chamadas de API podem gerar custos conforme o uso e o modelo. Defina limites de uso e monitore o faturamento.

## Segurança

Segredos ficam no servidor. O login administrativo usa cookie HTTP-only assinado, com sessão de oito horas. Use HTTPS em produção, credenciais fortes e nunca publique `.env.local`. O painel administrativo não substitui autenticação de usuários finais; o app principal ainda não restringe acesso a um único usuário.
