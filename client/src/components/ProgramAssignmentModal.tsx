import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardBody } from "@/components/Card";

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
    assignMutation.mutate({
      programId: selectedProgramId,
      clientId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardBody>
          <h2 className="font-bebas text-2xl mb-4" style={{ color: "var(--gold)" }}>
            Assign Program
          </h2>

          {programsLoading ? (
            <p style={{ color: "var(--muted)" }}>Loading programs...</p>
          ) : programs && programs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {programs.map((program) => (
                <label
                  key={program.id}
                  className="flex items-center p-3 rounded border cursor-pointer hover:bg-surface2 transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: selectedProgramId === program.id ? "rgba(217, 119, 6, 0.1)" : "transparent",
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
                    <p className="font-oswald" style={{ color: "var(--white)" }}>
                      {program.name}
                    </p>
                    <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                      {program.programType} • {program.duration} weeks
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }} className="mb-6">
              No programs available. Create a program first.
            </p>
          )}

          <div className="flex gap-2">
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
            <p style={{ color: "#fca5a5", fontSize: "14px" }} className="mt-3">
              Error: {assignMutation.error?.message || "Failed to assign program"}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
