import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function MessagingPage() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: messagesData, refetch } = trpc.messages.getThread.useQuery(
    { clientId: selectedClient || 1 },
    { enabled: !!selectedClient }
  );

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetch();
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedClient) return;
    sendMutation.mutate({
      clientId: selectedClient,
      content: messageText,
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-bebas text-4xl mb-8" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
          MESSAGING
        </h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Client List */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="font-bebas text-lg" style={{ color: "var(--white)" }}>
                  Conversations
                </h2>
              </CardHeader>
              <CardBody className="p-0">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((clientId) => (
                    <button
                      key={clientId}
                      onClick={() => setSelectedClient(clientId)}
                      style={{
                        backgroundColor: selectedClient === clientId ? "var(--surface3)" : "transparent",
                        borderLeftColor: selectedClient === clientId ? "var(--gold)" : "transparent",
                      }}
                      className="w-full text-left px-4 py-3 border-l-2 hover:bg-surface3 transition-colors"
                    >
                      <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>
                        Client {clientId}
                      </p>
                      <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                        Last message today
                      </p>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="col-span-2">
            {selectedClient ? (
              <Card className="flex flex-col h-96">
                <CardHeader>
                  <h2 className="font-bebas text-lg" style={{ color: "var(--white)" }}>
                    Client {selectedClient}
                  </h2>
                </CardHeader>
                <CardBody className="flex-1 overflow-y-auto mb-4">
                  <div className="space-y-4">
                    {messagesData && messagesData.length > 0 ? (
                      messagesData.map((msg: any) => (
                        <div key={msg.id} className="flex justify-end">
                          <div
                            style={{ backgroundColor: "var(--surface3)" }}
                            className="max-w-xs px-4 py-2 rounded"
                          >
                            <p className="font-rajdhani text-sm" style={{ color: "var(--white)" }}>
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="font-rajdhani text-sm text-center" style={{ color: "var(--muted)" }}>
                        No messages yet
                      </p>
                    )}
                  </div>
                </CardBody>
                <div className="flex gap-2 p-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="flex-1 border rounded px-4 py-2 font-rajdhani"
                  />
                  <Button variant="primary" onClick={handleSend}>
                    Send
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                    Select a client to start messaging
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
