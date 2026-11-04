const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function askGemini(contents: Array<Record<string, unknown>>, systemInstruction?: string, json = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Configure GEMINI_API_KEY no servidor.');
  const model = process.env.MODEL || 'gemini-3.5-flash';
  const response = await fetch(`${API_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      ...(json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
    }),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'A Gemini API não conseguiu responder.';
    throw new Error(message);
  }
  return data;
}

export function responseText(data: any) {
  return (data?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || '').join('').trim();
}
