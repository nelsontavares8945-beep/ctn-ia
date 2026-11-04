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
  WandSparkles,
  MoreHorizontal,
  Copy,
  MessagesSquare,
  Brain,
  Compass,
  UserRound,
  Search,
  PenLine,
  Lightbulb,
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

type ChatConversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
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
  conversations: 'ctnia.chat.conversations',
  activeConversation: 'ctnia.chat.active',
  images: 'ctnia.image.gallery',
  music: 'ctnia.music.history',
  documents: 'ctnia.documents.history',
  photos: 'ctnia.photo.history',
};

export default function CTNIAApp() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState('');
  const currentConversationIdRef = useRef('');
  const [chatLoaded, setChatLoaded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [activeTool, setActiveTool] = useState<'chat' | 'voice' | 'image' | 'photo' | 'document' | 'music'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      const storedConversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || 'null');
      const validConversations: ChatConversation[] = Array.isArray(storedConversations)
        ? storedConversations.filter((item: any) => item && typeof item.id === 'string' && Array.isArray(item.messages) && item.messages.length)
        : [];
      if (validConversations.length) {
        const savedActiveId = localStorage.getItem(STORAGE_KEYS.activeConversation);
        const active = validConversations.find((item) => item.id === savedActiveId) || validConversations[0];
        setChatConversations(validConversations);
        currentConversationIdRef.current = active.id;
        setCurrentConversationId(active.id);
        setMessages(active.messages);
      } else {
        // Migra o histórico antigo (um único array de mensagens) sem perder a conversa existente.
        const storedMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat) || 'null');
        const legacyMessages: Message[] = Array.isArray(storedMessages) && storedMessages.length
          ? storedMessages.filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string')
          : defaultMessages;
        const id = `chat-${Date.now()}`;
        const firstUserMessage = legacyMessages.find((item) => item.role === 'user')?.content;
        const migrated: ChatConversation = {
          id,
          title: firstUserMessage ? firstUserMessage.slice(0, 48) : 'Conversa anterior',
          messages: legacyMessages,
          updatedAt: new Date().toISOString(),
        };
        setChatConversations([migrated]);
        currentConversationIdRef.current = id;
        setCurrentConversationId(id);
        setMessages(legacyMessages);
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
    } finally {
      setChatLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !chatLoaded || !currentConversationId) return;
    const existing = chatConversations.find((item) => item.id === currentConversationId);
    const firstUserMessage = messages.find((item) => item.role === 'user')?.content;
    const nextConversation: ChatConversation = {
      id: currentConversationId,
      title: existing?.title && existing.title !== 'Nova conversa'
        ? existing.title
        : (firstUserMessage ? firstUserMessage.slice(0, 48) : 'Nova conversa'),
      messages,
      updatedAt: new Date().toISOString(),
    };
    const nextConversations = [nextConversation, ...chatConversations.filter((item) => item.id !== currentConversationId)].slice(0, 50);
    setChatConversations(nextConversations);
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(nextConversations));
    localStorage.setItem(STORAGE_KEYS.activeConversation, currentConversationId);
    localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(messages));
  }, [messages, currentConversationId, chatLoaded]);

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

  const newConversationId = () => `chat-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now()}`;

  const startNewConversation = () => {
    if (messages.length <= 1 && !messages.some((item) => item.role === 'user')) {
      setChatInput('');
      setActiveTool('chat');
      setToolsOpen(false);
      return;
    }
    const id = newConversationId();
    const conversation: ChatConversation = { id, title: 'Nova conversa', messages: defaultMessages, updatedAt: new Date().toISOString() };
    setChatConversations((previous) => [conversation, ...previous.filter((item) => item.id !== id)].slice(0, 50));
    currentConversationIdRef.current = id;
    setCurrentConversationId(id);
    setMessages(defaultMessages);
    setChatInput('');
    setActiveTool('chat');
    setToolsOpen(false);
  };

  const openConversation = (conversation: ChatConversation) => {
    currentConversationIdRef.current = conversation.id;
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages);
    setChatInput('');
    setActiveTool('chat');
    setMenuOpen(false);
  };

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
    if (/^lembre-se:\s*/i.test(userMessage)) {
      const fact = userMessage.replace(/^lembre-se:\s*/i, '').trim();
      if (!fact) { setMessages((prev) => [...prev, { role: 'assistant', content: 'Escreva depois de “Lembre-se:” o que você quer que eu guarde.' }]); return; }
      setIsBusy(true);
      try {
        const saved = await fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: fact }) });
        const result = await saved.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: saved.ok ? 'Anotei isso na memória desta sessão. Você pode revisar ou apagar em Memória.' : (result.error || 'Não consegui salvar essa memória.') }]);
      } catch { setMessages((prev) => [...prev, { role: 'assistant', content: 'Não consegui salvar essa memória agora.' }]); }
      finally { setIsBusy(false); }
      return;
    }
    setIsBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1).slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();
      const answer = data.answer || 'Não foi possível gerar a resposta agora.';

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
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

  const copyMessage = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <main className={`launcher-shell white-purple ${activeTool === 'chat' ? 'chat-home' : 'tool-open'}`}>
      <section className="launcher-main">
        <header className="launcher-topbar">
          <a className="launcher-brand" href="/"><span className="launcher-logo"><Sparkles size={18}/></span><span>CTN<span>.IA</span></span></a>
          <button className="top-assistant-pill new-chat-trigger" onClick={startNewConversation} aria-label="Começar nova conversa"><Plus size={16}/> Nova conversa</button>
          <button className="profile-button" disabled={isBusy} aria-label="Conversas e opções" title="Conversas salvas" onClick={() => setMenuOpen(!menuOpen)}><UserRound/></button>
          {menuOpen && <div className="header-popover">
            <button className="conversation-start" disabled={isBusy} onClick={() => { startNewConversation(); setMenuOpen(false); }}><Plus size={16}/> Nova conversa</button>
            <div className="conversation-menu-heading"><MessagesSquare size={14}/> Conversas salvas</div>
            <div className="conversation-menu-list">
              {chatConversations.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map((conversation) => (
                <button key={conversation.id} className={`saved-conversation ${conversation.id === currentConversationId ? 'active' : ''}`} title={conversation.title} disabled={isBusy} onClick={() => openConversation(conversation)}>
                  <span>{conversation.title || 'Nova conversa'}</span><small>{new Date(conversation.updatedAt).toLocaleDateString('pt-BR')}</small>
                </button>
              ))}
              {!chatConversations.length && <div className="conversation-menu-empty">Suas conversas vão aparecer aqui.</div>}
            </div>
            <a href="/history">Histórico de atividades</a><a href="/memory">Memória</a><a href="/music">Estúdio de música</a><a href="/admin/login">Painel</a>
          </div>}
        </header>
        {activeTool === 'chat' ? (
          <div className={`chat-stage ${messages.length > 1 ? 'has-messages' : 'home-stage'}`}>
            {messages.length <= 1 ? (
              <div className="home-welcome">
                <div className="home-greeting"><span>Oi, Babi <span className="wave">👋</span></span><h1>O que vamos fazer hoje?</h1><p>Converse, crie e resolva por aqui.</p></div>
                <section className="home-action-panel">
                  <div className="panel-spark"><Sparkles size={48}/><i/><b/></div>
                  <div className="panel-content"><h2>Sua assistente, pronta para ajudar</h2><div className="home-action-grid">
                    <button onClick={() => setChatInput('Pesquise e explique para mim: ')}><span><Search/></span><strong>Pesquisar</strong></button>
                    <button onClick={() => setChatInput('Me ajude a escrever: ')}><span><PenLine/></span><strong>Escrever</strong></button>
                    <button onClick={() => setActiveTool('document')}><span><FileText/></span><strong>Analisar arquivo</strong></button>
                    <button onClick={() => setChatInput('Me ajude a criar ideias para: ')}><span><Lightbulb/></span><strong>Criar ideias</strong></button>
                  </div></div>
                </section>
              </div>
            ) : (
              <div className="conversation" aria-live="polite">
                <div className="conversation-date">{new Date(chatConversations.find((item) => item.id === currentConversationId)?.updatedAt || Date.now()).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                {messages.slice(1).map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                    {message.role === 'assistant' ? <div className="message-avatar"><Sparkles size={16}/></div> : null}
                    <div className="message-content">
                      {message.role === 'assistant' && <div className="assistant-label"><strong>CTN.IA</strong><span>Assistente</span></div>}
                      <div className="message-copy">{message.content}</div>
                      {message.role === 'assistant' && <div className="message-actions"><button aria-label="Copiar resposta" title="Copiar" onClick={() => copyMessage(message.content)}><Copy/></button><button aria-label="Ouvir resposta" title="Ouvir" onClick={() => speak(message.content)}><Volume2/></button></div>}
                    </div>
                  </div>
                ))}
                {isBusy && <div className="chat-message assistant"><div className="message-avatar"><Sparkles size={16}/></div><div className="message-content"><div className="typing-dots"><i/><i/><i/></div></div></div>}
              </div>
            )}
            <div className="composer-wrap">
              {toolsOpen && <div className="tools-popover"><button onClick={() => {setActiveTool('photo');setToolsOpen(false);}}><Camera/>Foto</button><button onClick={() => {setActiveTool('document');setToolsOpen(false);}}><FileText/>Arquivo</button><button onClick={() => {setActiveTool('voice');setToolsOpen(false);}}><Mic/>Voz</button><button onClick={() => {setActiveTool('image');setToolsOpen(false);}}><ImagePlus/>Imagem</button><button onClick={() => {setActiveTool('music');setToolsOpen(false);}}><Music4/>Música</button></div>}
              <div className="composer">
                <div className="composer-input-line"><textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Me conta o que você precisa..." rows={1} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();sendChat();}}}/></div>
                <div className="composer-actions"><div className="composer-tools"><button title="Anexar foto, arquivo ou abrir ferramentas" aria-label="Anexar" onClick={() => setToolsOpen(!toolsOpen)}><Plus/></button><span className="voice-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></span><button title="Falar" aria-label="Falar" onClick={() => isListening ? stopVoiceInput() : startVoiceInput()} className={isListening ? 'listening' : ''}><Mic/></button></div><button className="send-button" onClick={sendChat} disabled={isBusy || !chatInput.trim()} aria-label="Enviar mensagem"><Send/></button></div>
              </div>
              <div className="composer-note">A CTN.IA pode cometer erros. Confira informações importantes.</div>
            </div>
            {messages.length <= 1 && <nav className="home-bottom-nav" aria-label="Navegação"><button className="active" onClick={startNewConversation}><span><Plus/></span>Nova conversa</button><a href="/memory"><span><Brain/></span>Memória</a><button onClick={() => setToolsOpen(!toolsOpen)}><span><Compass/></span>Explorar</button><button onClick={() => setMenuOpen(!menuOpen)}><span><UserRound/></span>Perfil</button></nav>}
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
