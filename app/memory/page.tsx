'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, Brain, Plus } from 'lucide-react';

type Memory = { id: string; content: string; createdAt: string };
export default function MemoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Memory[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => { const r = await fetch('/api/memory'); const d = await r.json(); if (r.ok) setItems(d.items || []); else setError(d.error || 'Não carregou.'); };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!content.trim()) return; setBusy(true); setError(''); try { const r = await fetch('/api/memory', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({content}) }); const d=await r.json(); if (!r.ok) throw new Error(d.error); setContent(''); await load(); } catch(e:any) { setError(e.message || 'Falha ao salvar.'); } finally { setBusy(false); } };
  const remove = async (id?: string) => { await fetch(`/api/memory${id ? `?id=${encodeURIComponent(id)}` : ''}`, { method:'DELETE' }); await load(); };
  return <main className="memory-page"><button className="memory-back" onClick={()=>router.push('/')}><ChevronLeft/> Voltar ao chat</button><header><span className="memory-icon"><Brain/></span><div><h1>Memória da CTN.IA</h1><p>Informações que você escolher ensinar ficam guardadas nesta sessão e podem ser apagadas por você.</p></div></header><form className="memory-form" onSubmit={e=>{e.preventDefault();save();}}><textarea value={content} maxLength={1200} onChange={e=>setContent(e.target.value)} placeholder="Ex.: Prefiro respostas curtas e em português do Brasil."/><button disabled={busy||!content.trim()}><Plus/> {busy?'Salvando…':'Salvar memória'}</button></form>{error&&<p className="memory-error">{error}</p>}<div className="memory-list-head"><h2>Memórias salvas ({items.length})</h2>{items.length>0&&<button onClick={()=>remove()}>Apagar todas</button>}</div>{items.length===0?<p className="memory-empty">Ainda não há memórias. Você também pode ensinar pelo chat escrevendo “Lembre-se: …”.</p>:<div className="memory-list">{items.map(item=><article key={item.id}><p>{item.content}</p><button title="Apagar memória" aria-label="Apagar memória" onClick={()=>remove(item.id)}><Trash2/></button></article>)}</div>}</main>;
}
