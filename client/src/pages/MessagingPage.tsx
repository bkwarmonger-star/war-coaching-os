import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function MessagingPage() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const { data: thread } = trpc.messages.getThread.useQuery(
    { clientId: selectedClientId || 0 },
    { enabled: !!selectedClientId }
  );

  const sendMessage = trpc.messages.send.useMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !messageContent.trim()) return;
    await sendMessage.mutateAsync({ clientId: selectedClientId, content: messageContent.trim() });
    setMessageContent("");
  };

  const clients = clientsData?.clients || [];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            Client Messaging
          </h1>
          <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
            Direct communication with your clients
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl border p-4 h-full"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)" }}
            >
              <h2
                className="font-oswald text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--muted)" }}
              >
                Conversations
              </h2>
              <div className="space-y-1.5">
                {clients.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-wide transition-all ${
                      selectedClientId === c.id
                        ? "font-bold"
                        : "hover:brightness-110"
                    }`}
                    style={
                      selectedClientId === c.id
                        ? { backgroundColor: "var(--gold)", color: "#000" }
                        : { backgroundColor: "var(--surface2)", color: "var(--white)" }
                    }
                  >
                    {c.name}
                  </button>
                ))}
                {clients.length === 0 && (
                  <p className="font-rajdhani text-sm text-center py-6" style={{ color: "var(--muted)" }}>
                    No clients yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div
              className="rounded-xl border p-6 flex flex-col"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-gold)",
                minHeight: "520px",
              }}
            >
              {selectedClientId ? (
                <>
                  <div
                    className="pb-4 mb-4 border-b"
                    style={{ borderColor: "var(--border-gold)" }}
                  >
                    <h2 className="font-bebas text-xl" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
                      {clients.find((c: any) => c.id === selectedClientId)?.name || "Client"}
                    </h2>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[320px]">
                    {thread && thread.length > 0 ? (
                      thread.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl max-w-xs ${
                            msg.senderId === user?.id ? "ml-auto" : "mr-auto"
                          }`}
                          style={
                            msg.senderId === user?.id
                              ? { backgroundColor: "var(--gold)", color: "#000" }
                              : { backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border-gold)" }
                          }
                        >
                          <p className="font-rajdhani text-sm">{msg.content}</p>
                          <p className="font-rajdhani text-xs opacity-60 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                          No messages yet — start the conversation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border font-rajdhani text-sm"
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border-gold)",
                        color: "var(--white)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!messageContent.trim() || sendMessage.isPending}
                      className="px-6 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all"
                      style={{ backgroundColor: "var(--gold)", color: "#000" }}
                    >
                      {sendMessage.isPending ? "…" : "Send"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <div className="font-bebas text-5xl opacity-10" style={{ color: "var(--gold)" }}>✉</div>
                  <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                    Select a client to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
