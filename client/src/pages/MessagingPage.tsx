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

    await sendMessage.mutateAsync({
      clientId: selectedClientId,
      content: messageContent.trim(),
    });

    setMessageContent("");
  };

  const clients = clientsData?.clients || [];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gold mb-8">Client Messaging</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-4 border border-gold/20 h-full">
              <h2 className="text-lg font-bold text-gold mb-4">Conversations</h2>
              <div className="space-y-2">
                {clients.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedClientId === c.id
                        ? "bg-gold text-black font-semibold"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 rounded-lg p-6 border border-gold/20 h-full flex flex-col">
              {selectedClientId ? (
                <>
                  <h2 className="text-xl font-bold text-gold mb-4">
                    {clients.find((c: any) => c.id === selectedClientId)?.name || "Client"}
                  </h2>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {thread && thread.length > 0 ? (
                      thread.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded ${
                            msg.senderId === user?.id
                              ? "bg-gold text-black ml-auto max-w-xs"
                              : "bg-gray-800 text-white mr-auto max-w-xs"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</p>
                    )}
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gold/30 rounded text-white placeholder-gray-500"
                    />
                    <button
                      type="submit"
                      disabled={!messageContent.trim() || sendMessage.isPending}
                      className="px-6 py-2 bg-gold text-black font-bold rounded hover:bg-gold/90 disabled:opacity-50"
                    >
                      {sendMessage.isPending ? "..." : "Send"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Select a client to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
