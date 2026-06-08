import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export default function MessagingPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const { data: thread } = trpc.messages.getThread.useQuery(
    { clientId: selectedClientId || 0 },
    { enabled: !!selectedClientId, refetchInterval: 8000 }
  );
  const { data: typingStatus } = trpc.messages.getTypingStatus.useQuery(
    { clientId: selectedClientId || 0 },
    { enabled: !!selectedClientId, refetchInterval: 3000 }
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: async () => {
      if (selectedClientId) await utils.messages.getThread.invalidate({ clientId: selectedClientId });
    },
  });

  const sendAttachment = trpc.messages.sendWithAttachment.useMutation({
    onSuccess: async () => {
      if (selectedClientId) await utils.messages.getThread.invalidate({ clientId: selectedClientId });
    },
  });

  const markThreadReadMutation = trpc.messages.markThreadRead.useMutation();
  const setTypingMutation = trpc.messages.setTyping.useMutation();

  useEffect(() => {
    const selectedFromUrl = new URLSearchParams(window.location.search).get("clientId");
    const parsedClientId = selectedFromUrl ? parseInt(selectedFromUrl, 10) : null;
    if (parsedClientId && !Number.isNaN(parsedClientId)) setSelectedClientId(parsedClientId);
  }, [location]);

  // Mark thread as read whenever we open a conversation
  useEffect(() => {
    if (selectedClientId) markThreadReadMutation.mutate({ clientId: selectedClientId });
  }, [selectedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop "typing…" when switching threads or unmounting
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (selectedClientId) setTypingMutation.mutate({ clientId: selectedClientId, isTyping: false });
    };
  }, [selectedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectClient = (clientId: number) => {
    setSelectedClientId(clientId);
    setLocation(`/messaging?clientId=${clientId}`);
    setPendingFile(null);
    setAttachError(null);
  };

  const handleContentChange = (value: string) => {
    setMessageContent(value);
    if (!selectedClientId) return;
    setTypingMutation.mutate({ clientId: selectedClientId, isTyping: value.trim().length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingMutation.mutate({ clientId: selectedClientId, isTyping: false });
    }, 4000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError("File is too large — 15MB max.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingFile({ name: file.name, type: file.type || "application/octet-stream", dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setAttachError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    if (!messageContent.trim() && !pendingFile) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingMutation.mutate({ clientId: selectedClientId, isTyping: false });

    if (pendingFile) {
      const base64 = pendingFile.dataUrl.split(",")[1] || "";
      await sendAttachment.mutateAsync({
        clientId: selectedClientId,
        content: messageContent.trim(),
        attachmentData: base64,
        attachmentName: pendingFile.name,
        attachmentType: pendingFile.type,
      });
      clearPendingFile();
      setMessageContent("");
      return;
    }

    await sendMessage.mutateAsync({ clientId: selectedClientId, content: messageContent.trim() });
    setMessageContent("");
  };

  const clients = clientsData?.clients || [];
  const isSending = sendMessage.isPending || sendAttachment.isPending;

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
              className="rounded-lg border p-4 h-full"
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
                    onClick={() => selectClient(c.id)}
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
              className="rounded-lg border p-6 flex flex-col"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-gold)",
                minHeight: "520px",
              }}
            >
              {selectedClientId ? (
                <>
                  <div
                    className="pb-4 mb-4 border-b flex items-center justify-between"
                    style={{ borderColor: "var(--border-gold)" }}
                  >
                    <h2 className="font-bebas text-xl" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
                      {clients.find((c: any) => c.id === selectedClientId)?.name || "Client"}
                    </h2>
                    {typingStatus?.clientTyping && (
                      <span className="font-rajdhani text-xs italic flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "var(--gold)", animationDelay: `${i * 0.12}s` }} />
                          ))}
                        </span>
                        typing…
                      </span>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[320px]">
                    {thread && thread.length > 0 ? (
                      thread.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg max-w-xs ${
                            msg.senderId === user?.id ? "ml-auto" : "mr-auto"
                          }`}
                          style={
                            msg.senderId === user?.id
                              ? { backgroundColor: "var(--gold)", color: "#000" }
                              : { backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border-gold)" }
                          }
                        >
                          <p className="font-rajdhani text-sm">{msg.content}</p>
                          {msg.attachmentUrl && (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-rajdhani text-xs underline mt-1 inline-block"
                              style={{ color: msg.senderId === user?.id ? "#000" : "var(--gold)" }}
                            >
                              📎 {msg.attachmentName || "Attachment"}
                            </a>
                          )}
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <p className="font-rajdhani text-xs opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {msg.senderId === user?.id && (
                              <p
                                className="font-rajdhani text-xs"
                                style={{
                                  color: msg.readAt ? "var(--success)" : "inherit",
                                  opacity: msg.readAt ? 1 : 0.6,
                                }}
                              >
                                {msg.readAt
                                  ? `Read ✓ ${new Date(msg.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                  : "Sent ✓"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                          No messages yet - start the conversation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachment preview */}
                  {pendingFile && (
                    <div className="mb-2 px-3 py-2 rounded-lg flex items-center justify-between gap-3" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                      <span className="font-rajdhani text-xs truncate" style={{ color: "var(--white)" }}>
                        📎 {pendingFile.name}
                      </span>
                      <button type="button" onClick={clearPendingFile} className="font-oswald text-xs uppercase" style={{ color: "var(--red)" }}>
                        Remove
                      </button>
                    </div>
                  )}
                  {attachError && (
                    <p className="font-rajdhani text-xs mb-2" style={{ color: "var(--red)" }}>{attachError}</p>
                  )}

                  {/* Send Form */}
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="message-attachment-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach a file"
                      className="px-3.5 py-2.5 rounded-lg font-oswald text-sm transition-all hover:brightness-110"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--gold)", border: "1px solid var(--border-gold)" }}
                    >
                      📎
                    </button>
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={pendingFile ? "Add a caption (optional)..." : "Type a message..."}
                      className="flex-1 px-4 py-2.5 border font-rajdhani text-sm"
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border-gold)",
                        color: "var(--white)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={(!messageContent.trim() && !pendingFile) || isSending}
                      className="px-6 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all"
                      style={{ backgroundColor: "var(--gold)", color: "#000" }}
                    >
                      {isSending ? "…" : "Send"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <div className="font-bebas text-4xl opacity-20" style={{ color: "var(--gold)" }}>MSG</div>
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
