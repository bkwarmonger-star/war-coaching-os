import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef } from "react";

export default function VideoCallPage() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [clientName, setClientName] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const clients = clientsData?.clients || [];

  const startCall = (customRoom?: string) => {
    const room = customRoom || roomName || `war-coaching-${Date.now()}`;
    setRoomName(room);
    setIsInCall(true);
  };

  const endCall = () => {
    setIsInCall(false);
    setRoomName("");
    setClientName("");
  };

  const generateRoomForClient = (clientId: number, name: string) => {
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const room = `war-coaching-${sanitized}-${clientId}`;
    setClientName(name);
    startCall(room);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <p style={{ color: "var(--muted)" }} className="font-rajdhani">Please log in to access video calls.</p>
      </div>
    );
  }

  if (isInCall) {
    return (
      <div style={{ backgroundColor: "var(--black)" }} className="min-h-screen flex flex-col">
        {/* Call Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div>
            <h2 className="font-bebas text-xl" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
              VIDEO SESSION {clientName && `— ${clientName}`}
            </h2>
            <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
              Room: {roomName}
            </p>
          </div>
          <button
            onClick={endCall}
            className="px-4 py-2 rounded font-oswald text-sm uppercase"
            style={{ backgroundColor: "var(--red)", color: "#fff" }}
          >
            End Call
          </button>
        </div>

        {/* Jitsi Meet Embed */}
        <div className="flex-1">
          <iframe
            ref={iframeRef}
            src={`https://meet.jit.si/${roomName}#config.prejoinConfig.enabled=false&userInfo.displayName=${encodeURIComponent(user.name || "Trainer")}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            style={{ width: "100%", height: "100%", border: "none", minHeight: "calc(100vh - 80px)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-bebas text-4xl mb-2" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
          VIDEO CALLS
        </h1>
        <p className="font-rajdhani text-sm mb-8" style={{ color: "var(--muted)" }}>
          Start a video session with a client. Powered by secure, encrypted video conferencing.
        </p>

        {/* Quick Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-bebas text-lg mb-4" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              QUICK START
            </h3>
            <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
              Create a new video room instantly. Share the room link with your client.
            </p>
            <button
              onClick={() => startCall()}
              className="w-full px-4 py-3 rounded font-oswald text-sm uppercase"
              style={{ backgroundColor: "var(--gold)", color: "#000" }}
            >
              Start New Session
            </button>
          </div>

          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-bebas text-lg mb-4" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              JOIN ROOM
            </h3>
            <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
              Enter a room name to join an existing session.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name..."
                className="flex-1 px-3 py-2 rounded text-sm font-rajdhani"
                style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--white)" }}
              />
              <button
                onClick={() => startCall()}
                disabled={!roomName}
                className="px-4 py-2 rounded font-oswald text-sm uppercase disabled:opacity-50"
                style={{ backgroundColor: "var(--gold)", color: "#000" }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Client List for Direct Calls */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="font-bebas text-lg mb-4" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
            CALL A CLIENT
          </h3>
          <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
            Start a dedicated video session with a specific client. Each client gets a unique, persistent room.
          </p>

          {clientsLoading ? (
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Loading clients...</p>
          ) : clientsError ? (
            <p className="font-rajdhani text-sm" style={{ color: "var(--red)" }}>Failed to load clients. Please try again.</p>
          ) : clients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clients.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => generateRoomForClient(client.id, client.name)}
                  className="flex items-center gap-3 p-3 rounded border text-left hover:border-gold transition-colors"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bebas text-sm"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>{client.name}</p>
                    <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>{client.trainingType || "General"}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
              No clients yet. Add clients to start video sessions with them.
            </p>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: "🎥", label: "HD Video", desc: "Crystal clear video quality" },
            { icon: "🔒", label: "Encrypted", desc: "End-to-end secure calls" },
            { icon: "📱", label: "Any Device", desc: "Works on phone, tablet, desktop" },
          ].map((feature) => (
            <div key={feature.label} className="text-center p-4 rounded" style={{ backgroundColor: "var(--surface)" }}>
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>{feature.label}</p>
              <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
