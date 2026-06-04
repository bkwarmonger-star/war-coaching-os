import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";

interface ProgramAssignmentModalProps {
  clientId: number;
  isOpen: boolean;
  onClose: () => void;
  onAssignSuccess?: () => void;
}

export default function ProgramAssignmentModal({ clientId, isOpen, onClose, onAssignSuccess }: ProgramAssignmentModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const { data: programs, isLoading: programsLoading } = trpc.programs.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: isOpen }
  );

  const assignMutation = trpc.programs.assign.useMutation({
    onSuccess: () => {
      setSelectedProgramId(null);
      onAssignSuccess?.();
      onClose();
    },
  });

  const handleAssign = () => {
    if (!selectedProgramId) return;
    assignMutation.mutate({ programId: selectedProgramId, clientId });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border-gold)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-gold)" }}>
          <h2 className="font-bebas text-2xl" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
            Assign Program
          </h2>
        </div>

        <div className="p-6">
          {programsLoading ? (
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Loading programs...</p>
          ) : programs && programs.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
              {programs.map((program) => (
                <label
                  key={program.id}
                  className="flex items-center p-3 rounded-xl border cursor-pointer transition-all hover:border-gold"
                  style={{
                    borderColor: selectedProgramId === program.id ? "var(--gold)" : "var(--border-gold)",
                    backgroundColor: selectedProgramId === program.id
                      ? "rgba(201,168,76,0.1)"
                      : "var(--surface2)",
                  }}
                >
                  <input
                    type="radio"
                    name="program"
                    value={program.id}
                    checked={selectedProgramId === program.id}
                    onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>
                      {program.name}
                    </p>
                    <p className="font-rajdhani text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {program.programType} • {program.duration} weeks
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="font-rajdhani text-sm mb-6" style={{ color: "var(--muted)" }}>
              No programs available. Create a program first.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedProgramId || assignMutation.isPending}
              className="flex-1"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>

          {assignMutation.isError && (
            <p className="font-rajdhani text-sm mt-3" style={{ color: "#fca5a5" }}>
              Error: {assignMutation.error?.message || "Failed to assign program"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
