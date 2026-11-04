import { askGemini, responseText } from '@/lib/gemini';

/** Tries the configured free providers in order without allowing one outage to stop the task. */
export async function generateTextWithFallback(prompt: string, systemInstruction: string, json = false): Promise<string> {
  const failures: string[] = [];

  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 2200,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Groq returned ${response.status}`);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (answer) return answer;
      throw new Error('Groq returned an empty answer');
    } catch (error) {
      console.error('Groq tool request failed:', error);
      failures.push('Groq');
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const data = await askGemini([{ role: 'user', parts: [{ text: prompt }] }], systemInstruction, json);
      const answer = responseText(data);
      if (answer) return answer;
      throw new Error('Gemini returned an empty answer');
    } catch (error) {
      console.error('Gemini tool request failed:', error);
      failures.push('Gemini');
    }
  }

  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    try {
      const model = process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
        body: JSON.stringify({
          messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
          max_tokens: 2200,
          temperature: 0.4,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) throw new Error(data?.errors?.[0]?.message || `Cloudflare returned ${response.status}`);
      const result = data?.result;
      const answer = (typeof result === 'string' ? result : result?.response || result?.choices?.[0]?.message?.content || '').trim();
      if (answer) return answer;
      throw new Error('Cloudflare returned an empty answer');
    } catch (error) {
      console.error('Cloudflare tool request failed:', error);
      failures.push('Cloudflare');
    }
  }

  throw new Error(failures.length ? `No configured AI provider answered (${failures.join(', ')}).` : 'No AI provider is configured.');
}

/** Uses Groq's vision model when available, then Gemini. Cloudflare vision is intentionally excluded until its model license agreement is explicitly accepted. */
export async function analyzeImageWithFallback(question: string, mimeType: string, base64: string): Promise<string> {
  const instruction = 'Analise a imagem e responda em português do Brasil. Seja claro e não invente detalhes que não possam ser vistos.';
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: [
              { type: 'text', text: question },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ] },
          ],
          temperature: 0.3,
          max_completion_tokens: 1200,
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Groq returned ${response.status}`);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (answer) return answer;
      throw new Error('Groq returned an empty image analysis');
    } catch (error) {
      console.error('Groq vision request failed; trying Gemini:', error);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const data = await askGemini([{ role: 'user', parts: [{ text: question }, { inline_data: { mime_type: mimeType, data: base64 } }] }], instruction);
    const answer = responseText(data);
    if (answer) return answer;
  }
  throw new Error('No configured image-analysis provider answered.');
}
