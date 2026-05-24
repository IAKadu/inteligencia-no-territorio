'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SUGESTOES = [
  'Quais 5 pacientes têm maior prioridade hoje?',
  'Quantas gestantes estão sem visita recente?',
  'Quais alertas abertos mais urgentes?',
  'Mostra cobertura geral e dos idosos 66+.',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!res.body) throw new Error('Sem body na resposta');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(m => [...m, { role: 'assistant', content: '' }]);
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE: linhas separadas por \n\n. Cada bloco: "event: X\ndata: Y"
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';  // último pode ser parcial
        for (const block of blocks) {
          const lines = block.split('\n');
          let event: string | null = null;
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            else if (line.startsWith('data: ')) data += line.slice(6);
          }
          if (event === 'message' && data) {
            assistantText += data;
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: 'assistant', content: assistantText };
              return copy;
            });
          }
          if (event === 'done') return;
        }
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `❌ Erro: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <header className="mb-6">
        <p className="t-section-label">Reunião Semanal</p>
        <h1 className="t-section-title">Chat IA</h1>
        <p className="text-grey-text mt-3 max-w-2xl">
          Pergunte sobre o território, prioridades, alertas, cobertura por grupo populacional.
          A IA consulta o banco em tempo real via ferramentas read-only.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-left p-4 bg-white border border-grey-mid rounded-md hover:bg-grey-card hover:shadow-sm transition text-sm"
            >
              <span className="text-brand-blue-light font-bold">💡</span> {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-4 rounded-md max-w-[85%] ${
              m.role === 'user'
                ? 'ml-auto bg-brand-blue-primary text-white'
                : 'bg-white border border-grey-mid'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${m.role === 'user' ? 'text-white/80' : 'text-brand-blue-primary'}`}>
              {m.role === 'user' ? '👤 Você' : '🤖 IA'}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="p-4 rounded-md bg-white border border-grey-mid max-w-[85%]">
            <div className="text-xs font-bold uppercase tracking-wide text-brand-blue-primary mb-2">🤖 IA</div>
            <div className="text-sm italic text-grey-text">pensando…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 sticky bottom-0 bg-white p-3 rounded-md border border-grey-mid shadow-sm"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte alguma coisa..."
          disabled={loading}
          className="flex-1 px-3 py-2 border border-grey-mid rounded-sm focus:outline-none focus:border-brand-blue-primary text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-brand-blue-primary text-white rounded-sm font-bold text-xs uppercase tracking-wide disabled:opacity-50 hover:bg-brand-blue-dark transition"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
