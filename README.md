# CTN.IA

Aplicação web de IA com chat, voz do navegador, geração de imagens, análise de fotos, leitura de documentos e criação de propostas musicais.

## Rodar localmente

Requisitos: Node.js 18+ e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`. Edite `.env.local` e reinicie o servidor para aplicar mudanças nas variáveis.

## Configurar a chave OpenAI

1. Crie uma chave em [platform.openai.com/api-keys](https://platform.openai.com/api-keys). A conta precisa ter acesso à API e faturamento configurado.
2. Abra `.env.local` na raiz do projeto e preencha `OPENAI_API_KEY=sua_chave_secreta`.
3. Nunca compartilhe essa chave, não a coloque em arquivos `NEXT_PUBLIC_*`, no código do frontend ou em commits. `.env.local` está ignorado pelo Git.
4. Para hospedagem, configure `OPENAI_API_KEY` na área de variáveis/segredos do provedor de hospedagem e faça um novo deploy.

O painel em `/admin` informa se o servidor recebeu a chave sem revelar seu valor. Para entrar, configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `AUTH_SECRET` no ambiente. Gere um segredo aleatório com pelo menos 32 caracteres para `AUTH_SECRET` e troque a senha de exemplo antes de publicar.

## Recursos e limites

- Chat, análise visual, documentos, geração de imagens e letras/arranjos usam a OpenAI quando a chave está configurada.
- Voz de entrada/saída usa APIs do navegador e depende de suporte e permissão do dispositivo.
- Documentos aceitos: PDF, DOCX e TXT, até 10 MB. PDFs compostos apenas por imagens precisam de OCR.
- A proposta musical é texto (letra, acordes, andamento e guia de melodia). Uma chave OpenAI não gera, por si só, uma faixa musical cantada; isso requer integração adicional com um provedor de áudio.
- Nenhuma IA garante respostas sempre certas ou informação em tempo real sem uma integração de busca atualizada.

## Segurança

Segredos ficam no servidor. O login administrativo usa cookie HTTP-only assinado, com sessão de oito horas. Use HTTPS em produção, credenciais fortes e nunca publique o arquivo `.env.local`.
