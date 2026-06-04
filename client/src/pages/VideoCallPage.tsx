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
    setClientName(name);
    startCall(`war-coaching-${sanitized}-${clientId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Please log in to access video calls.</p>
      </div>
    );
  }

  if (isInCall) {
    return (
      <div style={{ backgroundColor: "var(--black)" }} className="min-h-screen flex flex-col">
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border-gold)", backgroundColor: "var(--surface)" }}
        >
          <div>
            <h2 className="font-bebas text-xl" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
              VIDEO SESSION {clientName && `— ${clientName}`}
            </h2>
            <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>Room: {roomName}</p>
          </div>
          <button
            onClick={endCall}
            className="px-4 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest hover:brightness-110 transition-all"
            style={{ backgroundColor: "var(--red)", color: "#fff" }}
          >
            End Call
          </button>
        </div>
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
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)", color: "var(--white)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            Video Calls
          </h1>
          <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
            Start a secure video session with a client
          </p>
        </div>

        {/* Quick Start + Join Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
          >
            <h3 className="font-bebas text-lg mb-1" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              Quick Start
            </h3>
            <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
              Create a new video room instantly and share the link with your client.
            </p>
            <button
              onClick={() => startCall()}
              className="w-full px-4 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest hover:brightness-110 transition-all"
              style={{ backgroundColor: "var(--gold)", color: "#000" }}
            >
              Start New Session
            </button>
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
          >
            <h3 className="font-bebas text-lg mb-1" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              Join Room
            </h3>
            <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
              Enter a room name to rejoin an existing session.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name..."
                className="flex-1 px-3 py-2.5 border font-rajdhani text-sm"
                style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
              />
              <button
                onClick={() => startCall()}
                disabled={!roomName}
                className="px-4 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all"
                style={{ backgroundColor: "var(--gold)", color: "#000" }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Client Direct Calls */}
        <div
          className="p-6 rounded-xl border mb-6"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
        >
          <h3
            className="font-oswald text-xs uppercase tracking-widest mb-1"
            style={{ color: "var(--muted)" }}
          >
            Call a Client
          </h3>
          <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
            Each client gets a unique persistent room for dedicated sessions.
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
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-gold"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bebas text-sm flex-shrink-0"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>{client.name}</p>
                    <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                      {client.trainingType || "General"}
                    </p>
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

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "🎥", label: "HD Video", desc: "Crystal clear quality" },
            { icon: "🔒", label: "Encrypted", desc: "End-to-end secure" },
            { icon: "📱", label: "Any Device", desc: "Phone, tablet, desktop" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="text-center p-4 rounded-xl border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)" }}
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="font-oswald text-sm uppercase tracking-wide" style={{ color: "var(--white)" }}>
                {feature.label}
              </p>
              <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
