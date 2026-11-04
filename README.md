# CTN.IA

Sistema de inteligência artificial com:
- Chat conversacional
- Voz de entrada/saída
- Criação de imagens
- Análise de fotos
- Leitura de PDF e Word
- Geração de letras e melodias

## Requisitos
- Node.js 18+
- npm
- Chave de API OpenAI opcional para ativar IA real

## Instalação

```bash
npm install
cp .env.example .env.local
```

## Variáveis de ambiente

Edite o arquivo `.env.local` com suas chaves:

```env
OPENAI_API_KEY=
MODEL=gpt-4o-mini
APP_NAME=CTN.IA
```

Se você não definir a chave da OpenAI, o projeto usa um modo local com respostas simuladas, mas ainda mantém a interface funcionando.

## Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## Funcionalidades

### 1. Chat AI
- Respostas por IA em texto
- Suporte a conversa normal
- Possível busca em web com API de terceiros (opcional)

### 2. Voz
- Entrada por microfone via Web Speech API
- Saída em voz com SpeechSynthesis

### 3. Criação de imagens
- Prompt para gerar imagens
- Funciona com OpenAI Images API quando configurado
- Sem chave, gera uma imagem local em SVG como fallback

### 4. Análise de fotos
- Upload de imagem
- Perguntas sobre a imagem
- Uso de visão com OpenAI quando disponível

### 5. PDF e Word
- Upload de `.pdf`, `.docx`, `.doc`
- Leitura do texto do arquivo
- Resposta baseada no conteúdo

### 6. Música
- Geração de letra
- Criação de estrutura melódica e acordes
- Seu banco musical pode ser conectado depois com APIs especializadas

## Observação importante
Este projeto foi montado como MVP funcional com interface moderna e integração pronta para IA real. As respostas sempre corretas não são garantidas por qualquer IA; o que é possível é implementar com APIs confiáveis e boas regras de contexto.
