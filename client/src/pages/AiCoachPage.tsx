import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const QUICK_PROMPTS = [
  "Summarize all at-risk clients and recommended actions",
  "Design a 4-week HIIT and strength block for intermediate clients",
  "What macro adjustments should I make for clients who have stalled?",
  "Generate 5 motivational check-in follow-up messages",
];

type Msg = { role: "user" | "assistant"; content: string | any[] };

export default function AiCoachPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  if (!loading && (!user || user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <div className="text-center">
          <p className="font-bebas text-2xl" style={{ color: "var(--red)" }}>TRAINER ONLY</p>
          <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>AI Coach is for trainers only.</p>
          <a href="/login" className="mt-4 inline-block font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Sign In</a>
        </div>
      </div>
    );
  }
  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const assistantMutation = trpc.aiCoach.assistant.useMutation({
    onSuccess: (data) => {
      const respContent = typeof data.response === 'string' ? data.response : (Array.isArray(data.response) && data.response.length > 0 && 'text' in data.response[0] ? (data.response[0] as any).text ?? '' : '');
      setMessages(prev => [...prev, { role: "assistant", content: respContent }]);
    },
    onError: (e) => {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` as string }]);
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || assistantMutation.isPending) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    assistantMutation.mutate({ prompt: text, clientId: selectedClientId });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-bebas text-3xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>AI COACH ASSISTANT</h1>
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Powered by W.A.R. Coaching AI · Justin Watson</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>Context:</label>
            <select value={selectedClientId ?? ""} onChange={e => setSelectedClientId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 rounded font-rajdhani text-sm"
              style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}>
              <option value="">No specific client</option>
              {(clientsData?.clients ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-bebas text-3xl" style={{ background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000" }}>AI</div>
              <h2 className="font-bebas text-2xl mb-2" style={{ color: "var(--white)" }}>YOUR AI COACHING PARTNER</h2>
              <p className="font-rajdhani max-w-sm mx-auto mb-8" style={{ color: "var(--muted)" }}>Ask about client analysis, program design, nutrition, or anything coaching-related.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} onClick={() => send(q)} className="text-left px-4 py-3 rounded-lg font-rajdhani text-sm transition-all hover:opacity-80"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-gold)", color: "var(--muted)" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-oswald text-xs mr-3 mt-1" style={{ background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000" }}>AI</div>
              )}
              <div className="max-w-[75%] rounded-xl px-4 py-3" style={{
                backgroundColor: msg.role === "user" ? "var(--gold)" : "var(--surface)",
                color: msg.role === "user" ? "#000" : "var(--white)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
              }}>
                <p className="font-rajdhani text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {assistantMutation.isPending && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-oswald text-xs mr-3" style={{ background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000" }}>AI</div>
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--gold)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Ask anything about coaching, programs, nutrition, clients..."
            className="flex-1 px-4 py-3 rounded-xl font-rajdhani"
            style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
            disabled={assistantMutation.isPending}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || assistantMutation.isPending}
            className="px-5 py-3 rounded-xl font-oswald text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "var(--gold)", color: "#000" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
