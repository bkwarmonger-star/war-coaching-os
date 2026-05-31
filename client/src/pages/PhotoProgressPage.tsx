import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import React, { useState, useRef, useCallback } from "react";

type Pose = "front" | "back" | "left_side" | "right_side";

interface PhotoSet {
  id: number;
  date: Date;
  photos: { pose: Pose; url: string; timestamp: number }[];
  notes: string | null;
}

const POSE_CONFIG: Record<Pose, { label: string; instructions: string }> = {
  front: {
    label: "Front View",
    instructions: "Stand facing the camera. Arms slightly away from body, palms forward. Feet shoulder-width apart.",
  },
  back: {
    label: "Back View",
    instructions: "Stand with your back to the camera. Arms slightly away from body. Feet shoulder-width apart.",
  },
  left_side: {
    label: "Left Side",
    instructions: "Stand with your left side facing the camera. Arms relaxed at sides. Look straight ahead.",
  },
  right_side: {
    label: "Right Side",
    instructions: "Stand with your right side facing the camera. Arms relaxed at sides. Look straight ahead.",
  },
};

// SVG Silhouette overlay component
function SilhouetteOverlay({ pose }: { pose: Pose }) {
  const silhouettes: Record<Pose, React.ReactNode> = {
    front: (
      <svg viewBox="0 0 200 400" className="w-full h-full opacity-30">
        {/* Head */}
        <ellipse cx="100" cy="40" rx="22" ry="28" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Neck */}
        <rect x="92" y="66" width="16" height="14" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2" />
        {/* Torso */}
        <path d="M 70 80 Q 65 120 68 160 L 68 200 Q 70 220 80 230 L 120 230 Q 130 220 132 200 L 132 160 Q 135 120 130 80 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Left arm */}
        <path d="M 70 85 Q 55 100 48 130 Q 42 160 40 200 Q 38 220 42 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right arm */}
        <path d="M 130 85 Q 145 100 152 130 Q 158 160 160 200 Q 162 220 158 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Left leg */}
        <path d="M 80 230 Q 78 270 76 310 Q 74 350 76 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right leg */}
        <path d="M 120 230 Q 122 270 124 310 Q 126 350 124 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Center line */}
        <line x1="100" y1="10" x2="100" y2="395" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
      </svg>
    ),
    back: (
      <svg viewBox="0 0 200 400" className="w-full h-full opacity-30">
        {/* Head */}
        <ellipse cx="100" cy="40" rx="22" ry="28" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Neck */}
        <rect x="92" y="66" width="16" height="14" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2" />
        {/* Torso - back view shows shoulder blades */}
        <path d="M 70 80 Q 65 120 68 160 L 68 200 Q 70 220 80 230 L 120 230 Q 130 220 132 200 L 132 160 Q 135 120 130 80 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Shoulder blade indicators */}
        <ellipse cx="85" cy="120" rx="10" ry="15" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
        <ellipse cx="115" cy="120" rx="10" ry="15" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
        {/* Left arm */}
        <path d="M 70 85 Q 55 100 48 130 Q 42 160 40 200 Q 38 220 42 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right arm */}
        <path d="M 130 85 Q 145 100 152 130 Q 158 160 160 200 Q 162 220 158 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Left leg */}
        <path d="M 80 230 Q 78 270 76 310 Q 74 350 76 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right leg */}
        <path d="M 120 230 Q 122 270 124 310 Q 126 350 124 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Spine line */}
        <line x1="100" y1="68" x2="100" y2="230" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
      </svg>
    ),
    left_side: (
      <svg viewBox="0 0 200 400" className="w-full h-full opacity-30">
        {/* Head - side profile */}
        <ellipse cx="105" cy="40" rx="18" ry="26" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Neck */}
        <rect x="97" y="64" width="12" height="16" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2" />
        {/* Torso - side view */}
        <path d="M 88 80 Q 82 110 84 140 L 84 200 Q 86 220 92 230 L 118 230 Q 124 220 126 200 L 126 140 Q 128 110 122 80 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Arm */}
        <path d="M 90 90 Q 80 120 78 160 Q 76 200 80 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Left leg (visible) */}
        <path d="M 95 230 Q 92 270 90 310 Q 88 350 90 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right leg (behind) */}
        <path d="M 115 230 Q 118 270 120 310 Q 122 350 120 390" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.5" />
        {/* Posture line */}
        <line x1="105" y1="10" x2="105" y2="395" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
      </svg>
    ),
    right_side: (
      <svg viewBox="0 0 200 400" className="w-full h-full opacity-30">
        {/* Head - side profile */}
        <ellipse cx="95" cy="40" rx="18" ry="26" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Neck */}
        <rect x="89" y="64" width="12" height="16" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2" />
        {/* Torso - side view */}
        <path d="M 78 80 Q 72 110 74 140 L 74 200 Q 76 220 82 230 L 108 230 Q 114 220 116 200 L 116 140 Q 118 110 112 80 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Arm */}
        <path d="M 110 90 Q 120 120 122 160 Q 124 200 120 240" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Right leg (visible) */}
        <path d="M 105 230 Q 108 270 110 310 Q 112 350 110 390" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Left leg (behind) */}
        <path d="M 85 230 Q 82 270 80 310 Q 78 350 80 390" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.5" />
        {/* Posture line */}
        <line x1="95" y1="10" x2="95" y2="395" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
      </svg>
    ),
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {silhouettes[pose]}
    </div>
  );
}

// Photo capture/upload component with silhouette guide
function PhotoCapture({
  pose,
  onCapture,
  isUploading,
}: {
  pose: Pose;
  onCapture: (data: string) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const config = POSE_CONFIG[pose];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1920 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access denied. Please use the file upload option instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPreview(dataUrl);
      stopCamera();
    }
  }, [stopCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const confirmPhoto = () => {
    if (!preview) return;
    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64 = preview.split(",")[1];
    onCapture(base64);
    setPreview(null);
  };

  const retakePhoto = () => {
    setPreview(null);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gold/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gold/10">
        <h3 className="font-oswald text-lg text-gold uppercase">{config.label}</h3>
        <p className="text-gray-400 text-sm mt-1">{config.instructions}</p>
      </div>

      {/* Capture area */}
      <div className="relative aspect-[3/4] bg-gray-950">
        {/* Silhouette overlay - always visible */}
        <SilhouetteOverlay pose={pose} />

        {/* Camera view */}
        {isCameraActive && !preview && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Preview */}
        {preview && (
          <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Empty state */}
        {!isCameraActive && !preview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-sm text-center px-4 mt-auto mb-8">
              Align your body with the gold silhouette guide
            </p>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Controls */}
      <div className="p-4 space-y-2">
        {!isCameraActive && !preview && (
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="flex-1 px-4 py-3 bg-gold text-black font-bold rounded hover:bg-gold/90 transition-colors font-oswald uppercase text-sm"
            >
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors border border-gold/30 font-oswald uppercase text-sm"
            >
              Upload File
            </button>
          </div>
        )}

        {isCameraActive && (
          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="flex-1 px-4 py-3 bg-gold text-black font-bold rounded hover:bg-gold/90 transition-colors font-oswald uppercase text-sm"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 border border-gold/30 font-oswald uppercase text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {preview && (
          <div className="flex gap-2">
            <button
              onClick={confirmPhoto}
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-500 transition-colors font-oswald uppercase text-sm disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Confirm & Upload"}
            </button>
            <button
              onClick={retakePhoto}
              disabled={isUploading}
              className="px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 border border-gold/30 font-oswald uppercase text-sm"
            >
              Retake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Monthly comparison view
function MonthlyComparison({ photoSets }: { photoSets: PhotoSet[] }) {
  const [compareA, setCompareA] = useState<number>(0);
  const [compareB, setCompareB] = useState<number>(Math.min(1, photoSets.length - 1));
  const [selectedPose, setSelectedPose] = useState<Pose>("front");

  if (photoSets.length < 2) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gold/20 p-8 text-center">
        <p className="text-gray-400">
          {photoSets.length === 0
            ? "No photo sets yet. Upload your first set to start tracking progress."
            : "Upload at least 2 photo sets to enable comparison view."}
        </p>
      </div>
    );
  }

  const setA = photoSets[compareA];
  const setB = photoSets[compareB];
  const photoA = setA?.photos.find((p: any) => p.pose === selectedPose);
  const photoB = setB?.photos.find((p: any) => p.pose === selectedPose);

  return (
    <div className="bg-gray-900 rounded-lg border border-gold/20 p-6">
      <h3 className="font-oswald text-xl text-gold uppercase mb-4">Monthly Comparison</h3>

      {/* Pose selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(POSE_CONFIG) as Pose[]).map((pose) => (
          <button
            key={pose}
            onClick={() => setSelectedPose(pose)}
            className={`px-3 py-1.5 rounded text-sm font-rajdhani font-semibold transition-colors ${
              selectedPose === pose
                ? "bg-gold text-black"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gold/20"
            }`}
          >
            {POSE_CONFIG[pose].label}
          </button>
        ))}
      </div>

      {/* Date selectors */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-rajdhani">Before</label>
          <select
            value={compareA}
            onChange={(e) => setCompareA(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white text-sm"
          >
            {photoSets.map((set, i) => (
              <option key={set.id} value={i}>
                {new Date(set.date).toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1 font-rajdhani">After</label>
          <select
            value={compareB}
            onChange={(e) => setCompareB(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white text-sm"
          >
            {photoSets.map((set, i) => (
              <option key={set.id} value={i}>
                {new Date(set.date).toLocaleDateString("en-US", { month: "long", year: "numeric", day: "numeric" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison images */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative aspect-[3/4] bg-gray-950 rounded-lg overflow-hidden border border-gold/10">
          {photoA ? (
            <img src={photoA.url} alt="Before" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No {POSE_CONFIG[selectedPose].label.toLowerCase()} photo</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2">
            <p className="text-gold text-xs font-rajdhani font-semibold">
              {setA ? new Date(setA.date).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
        <div className="relative aspect-[3/4] bg-gray-950 rounded-lg overflow-hidden border border-gold/10">
          {photoB ? (
            <img src={photoB.url} alt="After" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No {POSE_CONFIG[selectedPose].label.toLowerCase()} photo</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2">
            <p className="text-gold text-xs font-rajdhani font-semibold">
              {setB ? new Date(setB.date).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Photo history timeline
function PhotoTimeline({ photoSets }: { photoSets: PhotoSet[] }) {
  if (photoSets.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gold/20 p-6">
      <h3 className="font-oswald text-xl text-gold uppercase mb-4">Photo History</h3>
      <div className="space-y-6">
        {photoSets.map((set) => (
          <div key={set.id} className="border-l-2 border-gold/30 pl-4">
            <p className="text-gold font-rajdhani font-semibold text-sm">
              {new Date(set.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            {set.notes && <p className="text-gray-400 text-sm mt-1">{set.notes}</p>}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {set.photos.map((photo: any, i: number) => (
                <div key={i} className="relative aspect-[3/4] bg-gray-950 rounded overflow-hidden border border-gold/10">
                  <img src={photo.url} alt={photo.pose} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                    <p className="text-gold text-[10px] font-rajdhani uppercase text-center">{photo.pose.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main page component
export default function PhotoProgressPage() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "compare" | "history">("upload");
  const [uploadingPose, setUploadingPose] = useState<Pose | null>(null);
  const [notes, setNotes] = useState("");

  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const { data: photoSets, refetch: refetchPhotos } = trpc.progress.getPhotoSets.useQuery(
    { clientId: selectedClientId || 0 },
    { enabled: !!selectedClientId }
  );

  const uploadPhoto = trpc.progress.uploadProgressPhoto.useMutation({
    onSuccess: () => {
      refetchPhotos();
      setUploadingPose(null);
    },
  });

  const handlePhotoCapture = async (pose: Pose, photoData: string) => {
    if (!selectedClientId) return;
    setUploadingPose(pose);
    await uploadPhoto.mutateAsync({
      clientId: selectedClientId,
      pose,
      photoData,
      notes: notes || undefined,
    });
  };

  const clients = clientsData?.clients || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Please log in to access progress photos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-5xl text-gold tracking-wide">Progress Photos</h1>
          <p className="text-gray-400 font-rajdhani mt-1">
            Guided photo capture with silhouette overlays for consistent progress tracking
          </p>
        </div>

        {/* Client selector */}
        <div className="bg-gray-900 rounded-lg border border-gold/20 p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-300 mb-2 font-rajdhani">Select Client</label>
              <select
                value={selectedClientId || ""}
                onChange={(e) => setSelectedClientId(parseInt(e.target.value) || null)}
                className="w-full md:w-80 px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white font-rajdhani"
              >
                <option value="">Choose a client...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {selectedClientId && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-rajdhani">Session Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Week 4 check-in, post-cut..."
                  className="w-full md:w-80 px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white font-rajdhani"
                />
              </div>
            )}
          </div>
        </div>

        {selectedClientId ? (
          <>
            {/* Monthly compliance summary */}
            {photoSets && (() => {
              const months: { month: string; status: "complete" | "incomplete" | "missing" }[] = [];
              const now = new Date();
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                const set = (photoSets as PhotoSet[]).find(s => {
                  const sd = new Date(s.date);
                  return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
                });
                if (!set) months.push({ month: monthLabel, status: "missing" });
                else if (set.photos.length >= 4) months.push({ month: monthLabel, status: "complete" });
                else months.push({ month: monthLabel, status: "incomplete" });
              }
              return (
                <div className="bg-gray-900/50 rounded-lg border border-gold/10 p-4 mb-6">
                  <h4 className="font-oswald text-sm text-gold uppercase mb-3">6-Month Compliance</h4>
                  <div className="flex gap-2">
                    {months.map(m => (
                      <div key={m.month} className="flex-1 text-center">
                        <div className={`w-full h-2 rounded-full mb-1 ${
                          m.status === "complete" ? "bg-green-500" :
                          m.status === "incomplete" ? "bg-yellow-500" : "bg-red-500/50"
                        }`} />
                        <p className="text-[10px] font-rajdhani text-gray-400">{m.month}</p>
                        <p className={`text-[9px] font-rajdhani font-semibold ${
                          m.status === "complete" ? "text-green-400" :
                          m.status === "incomplete" ? "text-yellow-400" : "text-red-400"
                        }`}>{m.status === "complete" ? "Complete" : m.status === "incomplete" ? "Incomplete" : "Missing"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Tab navigation */}
            <div className="flex gap-2 mb-6">
              {[
                { id: "upload" as const, label: "Capture Photos" },
                { id: "compare" as const, label: "Compare Progress" },
                { id: "history" as const, label: "Photo History" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded font-oswald uppercase text-sm tracking-wide transition-colors ${
                    activeTab === tab.id
                      ? "bg-gold text-black"
                      : "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gold/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {activeTab === "upload" && (
              <div>
                {/* Instructions */}
                <div className="bg-gray-900/50 rounded-lg border border-gold/10 p-4 mb-6">
                  <h3 className="font-oswald text-gold uppercase text-sm mb-2">Photo Guidelines</h3>
                  <ul className="text-gray-400 text-sm space-y-1 font-rajdhani">
                    <li>• Wear as little clothing as you are comfortable with for accurate tracking</li>
                    <li>• Use consistent lighting and background for each session</li>
                    <li>• Align your body with the gold silhouette guide for consistent positioning</li>
                    <li>• Capture all 4 poses (front, back, left side, right side) for a complete set</li>
                    <li>• Minimum 1 complete photo set per month required</li>
                  </ul>
                </div>

                {/* Pose completion status */}
                {photoSets && photoSets.length > 0 && (() => {
                  const currentMonth = new Date();
                  const currentSet = (photoSets as PhotoSet[]).find(s => {
                    const d = new Date(s.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  });
                  const capturedPoses = currentSet ? currentSet.photos.map((p: any) => p.pose) : [];
                  const allPoses: Pose[] = ["front", "back", "left_side", "right_side"];
                  return (
                    <div className="bg-gray-900/50 rounded-lg border border-gold/10 p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-oswald text-sm text-gold uppercase">This Month's Set</h4>
                        <span className={`text-xs font-rajdhani font-semibold px-2 py-0.5 rounded ${
                          capturedPoses.length >= 4 ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"
                        }`}>
                          {capturedPoses.length}/4 Poses Complete
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {allPoses.map(pose => (
                          <div key={pose} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-rajdhani ${
                            capturedPoses.includes(pose)
                              ? "bg-green-900/30 text-green-400 border border-green-600/30"
                              : "bg-gray-800 text-gray-500 border border-gray-700"
                          }`}>
                            <span>{capturedPoses.includes(pose) ? "✓" : "○"}</span>
                            <span className="capitalize">{pose.replace("_", " ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Photo capture grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {(Object.keys(POSE_CONFIG) as Pose[]).map((pose) => (
                    <PhotoCapture
                      key={pose}
                      pose={pose}
                      onCapture={(data) => handlePhotoCapture(pose, data)}
                      isUploading={uploadingPose === pose}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Compare tab */}
            {activeTab === "compare" && (
              <MonthlyComparison photoSets={(photoSets as PhotoSet[]) || []} />
            )}

            {/* History tab */}
            {activeTab === "history" && (
              <PhotoTimeline photoSets={(photoSets as PhotoSet[]) || []} />
            )}
          </>
        ) : (
          <div className="bg-gray-900 rounded-lg border border-gold/20 p-12 text-center">
            <div className="text-gold text-5xl mb-4 opacity-30">📸</div>
            <p className="text-gray-400 font-rajdhani text-lg">
              Select a client above to start capturing progress photos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
