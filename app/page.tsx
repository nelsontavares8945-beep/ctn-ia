"use client";

import { useRef, useState } from 'react';
import {
  Camera,
  FileText,
  ImagePlus,
  Mic,
  MicOff,
  Music4,
  Send,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';

const defaultMessages = [
  {
    role: 'assistant',
    content:
      'Olá! Sou a CTN.IA, sua assistente de IA com chat, voz, imagens, documentos e música. Como posso ajudar hoje?',
  },
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function CTNIAApp() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicResult, setMusicResult] = useState<any>(null);
  const [documentAnswer, setDocumentAnswer] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [photoQuestion, setPhotoQuestion] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      const answer = data.answer || 'Não foi possível gerar a resposta agora.';

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      speak(answer);
    } catch (error) {
      const fallback = 'Tive um problema ao consultar a IA. Tente novamente em instantes.';
      setMessages((prev) => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setIsBusy(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsBusy(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const data = await response.json();
      setImageResult(data.image || null);
    } catch (error) {
      setImageResult(null);
    } finally {
      setIsBusy(false);
    }
  };

  const analyzePhoto = async (file: File) => {
    setIsBusy(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', photoQuestion || 'Descreva o que aparece na imagem e responda de forma útil.');

    try {
      const response = await fetch('/api/photos/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setPhotoAnalysis(data.analysis || 'Nenhuma análise retornada.');
      speak(data.analysis || 'Imagem recebida pela CTN.IA.');
    } catch (error) {
      setPhotoAnalysis('Não foi possível analisar a imagem agora.');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result));
    };
    reader.readAsDataURL(file);

    await analyzePhoto(file);
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', 'Resuma e responda o que está no documento de forma clara.');

    try {
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDocumentAnswer(data.answer || 'Documento processado.');
      setDocumentText(data.textPreview || '');
      speak(data.answer || 'Documento processado pela CTN.IA.');
    } catch (error) {
      setDocumentAnswer('Não foi possível ler o documento agora.');
    } finally {
      setIsBusy(false);
    }
  };

  const generateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsBusy(true);

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: musicPrompt }),
      });

      const data = await response.json();
      setMusicResult(data);
    } catch (error) {
      setMusicResult({
        lyrics: 'Não foi possível gerar a música agora.',
        melody: 'C - G - Am - F',
        chords: ['C', 'G', 'Am', 'F'],
        tempo: 92,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="container">
      <div className="hero">
        <div>
          <span className="tag">CTN.IA</span>
          <h1>Seu sistema de IA completo</h1>
          <p>
            Chat, voz, imagens, fotos, documentos, letras e música em uma interface moderna.
          </p>
        </div>
        <div className="hero-badges">
          <span>💬 Chat</span>
          <span>🎙️ Voz</span>
          <span>🖼️ Imagens</span>
          <span>📄 Documentos</span>
          <span>🎵 Música</span>
        </div>
      </div>

      <section className="grid">
        <div className="card wide">
          <div className="card-header">
            <Sparkles />
            <h2>Chat da CTN.IA</h2>
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                {message.content}
              </div>
            ))}
          </div>

          <div className="input-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte qualquer coisa para a CTN.IA..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChat();
              }}
            />
            <button className="icon-button" onClick={startVoiceInput} title="Ativar voz">
              {isListening ? <MicOff /> : <Mic />}
            </button>
            <button className="primary-button" onClick={sendChat} disabled={isBusy}>
              <Send />
              Enviar
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Volume2 />
            <h2>Voz</h2>
          </div>

          <p className="muted">Use o microfone para falar e a IA responde em voz alta.</p>
          <button className="secondary-button" onClick={() => (isListening ? stopVoiceInput() : startVoiceInput())}>
            {isListening ? <MicOff /> : <Mic />}
            {isListening ? 'Parar voz' : 'Falar com a IA'}
          </button>
          <button className="secondary-button" onClick={() => speak('CTN.IA pronta para responder.')}>Testar áudio</button>
        </div>

        <div className="card">
          <div className="card-header">
            <ImagePlus />
            <h2>Gerar imagem</h2>
          </div>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Descreva a imagem que você deseja criar..."
          />
          <button className="primary-button" onClick={generateImage} disabled={isBusy}>
            <Sparkles />
            Criar imagem
          </button>
          {imageResult && (
            <div className="image-preview">
              <img src={imageResult} alt="Imagem gerada pela CTN.IA" />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <Camera />
            <h2>Fotos e análise</h2>
          </div>
          <textarea
            value={photoQuestion}
            onChange={(e) => setPhotoQuestion(e.target.value)}
            placeholder="Pergunte o que está na foto..."
          />
          <label className="upload-button">
            <Upload />
            Enviar foto
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
          </label>
          {photoPreview && (
            <div className="image-preview small">
              <img src={photoPreview} alt="Foto enviada" />
            </div>
          )}
          {photoAnalysis && <div className="result-box">{photoAnalysis}</div>}
        </div>

        <div className="card">
          <div className="card-header">
            <FileText />
            <h2>PDF e Word</h2>
          </div>
          <label className="upload-button">
            <Upload />
            Ler documento
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentUpload} />
          </label>
          {documentAnswer && <div className="result-box">{documentAnswer}</div>}
          {documentText && <pre className="document-preview">{documentText.slice(0, 1000)}</pre>}
        </div>

        <div className="card">
          <div className="card-header">
            <Music4 />
            <h2>Letras e música</h2>
          </div>
          <textarea
            value={musicPrompt}
            onChange={(e) => setMusicPrompt(e.target.value)}
            placeholder="Ex.: uma música pop emocional sobre superação e luz..."
          />
          <button className="primary-button" onClick={generateMusic} disabled={isBusy}>
            <Music4 />
            Criar música
          </button>

          {musicResult && (
            <div className="music-box">
              <div>
                <strong>Tempo:</strong> {musicResult.tempo || 92} BPM
              </div>
              <div>
                <strong>Acordes:</strong> {(musicResult.chords || []).join(' - ')}
              </div>
              <div>
                <strong>Melodia:</strong> {musicResult.melody || 'C - G - Am - F'}
              </div>
              <pre>{musicResult.lyrics || 'Sem letra gerada.'}</pre>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
