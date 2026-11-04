"use client";

import { useEffect, useRef, useState } from 'react';
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
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUp,
  WandSparkles,
} from 'lucide-react';

const defaultMessages: Message[] = [
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

type HistoryItem = {
  question: string;
  answer: string;
  date: string;
};

type MusicHistoryItem = {
  prompt: string;
  lyrics: string;
  melody: string;
  chords: string[];
  tempo: number;
  date: string;
};

type ImageHistoryItem = {
  src: string;
  prompt: string;
  date: string;
};

const STORAGE_KEYS = {
  chat: 'ctnia.chat.history',
  images: 'ctnia.image.gallery',
  music: 'ctnia.music.history',
  documents: 'ctnia.documents.history',
  photos: 'ctnia.photo.history',
};

export default function CTNIAApp() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [chatInput, setChatInput] = useState('');
  const [activeTool, setActiveTool] = useState<'chat' | 'voice' | 'image' | 'photo' | 'document' | 'music'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [documentHistory, setDocumentHistory] = useState<HistoryItem[]>([]);
  const [musicHistory, setMusicHistory] = useState<MusicHistoryItem[]>([]);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [photoHistory, setPhotoHistory] = useState<HistoryItem[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat) || 'null');
      if (Array.isArray(storedMessages) && storedMessages.length) {
        setMessages(storedMessages);
      }

      const storedImages = JSON.parse(localStorage.getItem(STORAGE_KEYS.images) || 'null');
      if (Array.isArray(storedImages)) setImageHistory(storedImages);

      const storedMusic = JSON.parse(localStorage.getItem(STORAGE_KEYS.music) || 'null');
      if (Array.isArray(storedMusic)) setMusicHistory(storedMusic);

      const storedDocuments = JSON.parse(localStorage.getItem(STORAGE_KEYS.documents) || 'null');
      if (Array.isArray(storedDocuments)) setDocumentHistory(storedDocuments);

      const storedPhotos = JSON.parse(localStorage.getItem(STORAGE_KEYS.photos) || 'null');
      if (Array.isArray(storedPhotos)) setPhotoHistory(storedPhotos);
    } catch {
      // Ignora erros de leitura local em navegador.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.images, JSON.stringify(imageHistory));
  }, [imageHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.music, JSON.stringify(musicHistory));
  }, [musicHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(documentHistory));
  }, [documentHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.photos, JSON.stringify(photoHistory));
  }, [photoHistory]);

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
      const nextImage = data.image || null;
      setImageResult(nextImage);
      if (nextImage) {
        setImageHistory((prev) => [{ src: nextImage, prompt: imagePrompt, date: new Date().toLocaleString('pt-BR') }, ...prev].slice(0, 8));
      }
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
      const answer = data.analysis || 'Nenhuma análise retornada.';
      setPhotoAnalysis(answer);
      setPhotoHistory((prev) => [{ question: photoQuestion || 'Análise de foto', answer, date: new Date().toLocaleString('pt-BR') }, ...prev].slice(0, 6));
      speak(answer);
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
      const answer = data.answer || 'Documento processado.';
      setDocumentAnswer(answer);
      setDocumentText(data.textPreview || '');
      setDocumentHistory((prev) => [{ question: file.name, answer, date: new Date().toLocaleString('pt-BR') }, ...prev].slice(0, 6));
      speak(answer);
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
      const nextMusic = {
        prompt: musicPrompt,
        lyrics: data.lyrics || 'Sem letra gerada.',
        melody: data.melody || 'C - G - Am - F',
        chords: data.chords || ['C', 'G', 'Am', 'F'],
        tempo: data.tempo || 92,
        date: new Date().toLocaleString('pt-BR'),
      };
      setMusicResult(nextMusic);
      setMusicHistory((prev) => [nextMusic, ...prev].slice(0, 6));
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

  const totalStats = {
    chatCount: messages.length,
    imageCount: imageHistory.length,
    musicCount: musicHistory.length,
    docCount: documentHistory.length,
    photoCount: photoHistory.length,
  };

  const toolNames = { chat: 'Nova conversa', voice: 'Conversa por voz', image: 'Criar imagem', photo: 'Analisar foto', document: 'Ler documento', music: 'Estúdio musical' };

  return (
    <main className={`launcher-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="launcher-sidebar">
        <div className="launcher-brand-row"><a className="launcher-brand" href="/"><span className="launcher-logo">C</span><span>CTN<span>.IA</span></span></a><button className="sidebar-toggle" aria-label="Recolher menu" onClick={() => setSidebarOpen(false)}><PanelLeftClose /></button></div>
        {!sidebarOpen && <button className="sidebar-toggle reopen" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><PanelLeftOpen /></button>}
        <button className="new-chat" onClick={() => { setActiveTool('chat'); setMessages(defaultMessages); setChatInput(''); }}><Plus size={18}/> Nova conversa</button>
        <div className="sidebar-section-label">FERRAMENTAS</div>
        <nav className="tool-nav">
          <button className={activeTool === 'chat' ? 'selected' : ''} onClick={() => setActiveTool('chat')}><Sparkles/> <span>Assistente</span></button>
          <button className={activeTool === 'voice' ? 'selected' : ''} onClick={() => setActiveTool('voice')}><Volume2/> <span>Conversa por voz</span></button>
          <button className={activeTool === 'image' ? 'selected' : ''} onClick={() => setActiveTool('image')}><ImagePlus/> <span>Criar imagem</span></button>
          <button className={activeTool === 'photo' ? 'selected' : ''} onClick={() => setActiveTool('photo')}><Camera/> <span>Analisar foto</span></button>
          <button className={activeTool === 'document' ? 'selected' : ''} onClick={() => setActiveTool('document')}><FileText/> <span>PDF e documentos</span></button>
          <button className={activeTool === 'music' ? 'selected' : ''} onClick={() => setActiveTool('music')}><Music4/> <span>Estúdio musical</span></button>
        </nav>
        <div className="sidebar-history"><div className="sidebar-section-label">RECENTES</div>{messages.filter(m => m.role === 'user').slice(-6).reverse().map((m, i) => <button key={`${m.content}-${i}`} onClick={() => setActiveTool('chat')} title={m.content}><span className="history-dot"/>{m.content}</button>)}</div>
        <div className="sidebar-bottom"><span className="online-dot"/> Gemini gratuito <a href="/admin/login">Painel</a></div>
      </aside>
      <section className="launcher-main">
        <header className="launcher-topbar"><div className="topbar-title">{toolNames[activeTool]} <span className="model-pill">Gemini</span></div><button className="topbar-avatar" title="CTN.IA">C</button></header>
        {activeTool === 'chat' ? (
          <div className={`chat-stage ${messages.length > 1 ? 'has-messages' : ''}`}>
            {messages.length <= 1 ? <div className="welcome-block"><div className="welcome-spark"><Sparkles size={24}/></div><h1>Olá, Babi. <span>O que vamos criar?</span></h1><p>Converse comigo, envie um documento ou escolha uma ferramenta para começar.</p></div> : <div className="conversation" aria-live="polite">{messages.slice(1).map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}><div className="message-avatar">{message.role === 'assistant' ? 'C' : 'B'}</div><div className="message-copy">{message.content}</div></div>)}{isBusy && <div className="chat-message assistant"><div className="message-avatar">C</div><div className="typing-dots"><i/><i/><i/></div></div>}</div>}
            {messages.length <= 1 && <div className="suggestion-grid"><button onClick={() => setChatInput('Me ajude a organizar minhas ideias para hoje')}><span>✦</span><strong>Organize minhas ideias</strong><small>Transforme pensamentos em um plano</small></button><button onClick={() => setChatInput('Explique um assunto difícil de um jeito simples')}><span>⌘</span><strong>Explique algo</strong><small>Aprenda passo a passo, sem complicação</small></button><button onClick={() => { setActiveTool('document'); }}><FileText/><strong>Leia um documento</strong><small>Envie PDF, Word ou texto</small></button><button onClick={() => setActiveTool('music')}><Music4/><strong>Crie uma música</strong><small>Faça uma letra do seu jeito</small></button></div>}
            <div className="composer-wrap"><div className="composer"><textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Escreva sua mensagem para a CTN.IA..." rows={1} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}/><div className="composer-actions"><div className="composer-tools"><button title="Enviar foto" onClick={() => setActiveTool('photo')}><Camera/></button><button title="Ler documento" onClick={() => setActiveTool('document')}><FileText/></button><button title="Falar" onClick={() => isListening ? stopVoiceInput() : startVoiceInput()} className={isListening ? 'listening' : ''}><Mic/></button></div><button className="send-button" onClick={sendChat} disabled={isBusy || !chatInput.trim()} aria-label="Enviar mensagem"><ArrowUp/></button></div></div><div className="composer-note">A CTN.IA pode cometer erros. Confira informações importantes.</div></div>
          </div>
        ) : (
          <div className="tool-stage"><button className="back-chat" onClick={() => setActiveTool('chat')}>← Voltar ao chat</button><div className="tool-heading"><span className="tool-heading-icon">{activeTool === 'voice' ? <Volume2/> : activeTool === 'image' ? <ImagePlus/> : activeTool === 'photo' ? <Camera/> : activeTool === 'document' ? <FileText/> : <Music4/>}</span><h1>{toolNames[activeTool]}</h1><p>{activeTool === 'voice' ? 'Fale sua mensagem; eu transcrevo e respondo em voz alta.' : activeTool === 'image' ? 'Descreva a imagem que você quer criar.' : activeTool === 'photo' ? 'Envie uma foto e pergunte o que deseja saber.' : activeTool === 'document' ? 'Envie um PDF, Word ou texto para eu resumir e analisar.' : 'Descreva o estilo e o tema da música que vamos compor.'}</p></div>
            {activeTool === 'voice' && <div className="tool-card"><button className={`voice-orb ${isListening ? 'listening' : ''}`} onClick={() => isListening ? stopVoiceInput() : startVoiceInput()}>{isListening ? <MicOff/> : <Mic/>}</button><strong>{isListening ? 'Estou ouvindo…' : 'Toque para falar'}</strong><span>{chatInput || 'Sua fala aparecerá aqui para você enviar no chat.'}</span><button className="secondary-button" onClick={() => speak('CTN.IA pronta para responder.')}>Testar áudio</button></div>}
            {activeTool === 'image' && <div className="tool-card"><textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Ex.: uma paisagem surreal ao pôr do sol, em tons violeta..."/><button className="primary-button" onClick={generateImage} disabled={isBusy}><WandSparkles/> {isBusy ? 'Criando…' : 'Criar imagem'}</button>{imageResult && <div className="image-preview"><img src={imageResult} alt="Imagem criada"/></div>}</div>}
            {activeTool === 'photo' && <div className="tool-card"><textarea value={photoQuestion} onChange={e => setPhotoQuestion(e.target.value)} placeholder="O que você quer saber sobre a foto?"/><label className="upload-button"><Upload/> Escolher foto<input type="file" accept="image/*" onChange={handlePhotoUpload}/></label>{photoPreview && <div className="image-preview small"><img src={photoPreview} alt="Foto enviada"/></div>}{photoAnalysis && <div className="result-box">{photoAnalysis}</div>}</div>}
            {activeTool === 'document' && <div className="tool-card"><label className="dropzone"><Upload/><strong>Escolha seu documento</strong><span>PDF, DOC, DOCX ou TXT</span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleDocumentUpload}/></label>{documentAnswer && <div className="result-box">{documentAnswer}</div>}{documentText && <pre className="document-preview">{documentText.slice(0, 1000)}</pre>}</div>}
            {activeTool === 'music' && <div className="tool-card"><textarea value={musicPrompt} onChange={e => setMusicPrompt(e.target.value)} placeholder="Ex.: pop animado sobre recomeçar, com refrão marcante..."/><button className="primary-button" onClick={generateMusic} disabled={isBusy}><Music4/> {isBusy ? 'Compondo…' : 'Criar música'}</button>{musicResult && <div className="music-box"><div><strong>Tempo:</strong> {musicResult.tempo || 92} BPM</div><div><strong>Acordes:</strong> {(musicResult.chords || []).join(' - ')}</div><div><strong>Melodia:</strong> {musicResult.melody || 'C - G - Am - F'}</div><pre>{musicResult.lyrics || 'Sem letra gerada.'}</pre></div>}</div>}
          </div>
        )}
      </section>
    </main>
  );
}
