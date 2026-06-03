import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

export default function PublicClientProfilePage() {
  const [route, params] = useRoute("/public-profile/:clientId");
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;

  const { data: profileData, isLoading, error } = trpc.portal.getPublicProfile.useQuery(
    { clientId },
    { enabled: !!clientId }
  );

  if (!route) {
    return <div style={{ padding: "20px", color: "var(--gold)" }}>Route not matched</div>;
  }

  if (isLoading) {
    return <div style={{ padding: "20px", color: "var(--gold)" }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "var(--gold)" }}>Error: {error.message}</div>;
  }

  if (!profileData) {
    return <div style={{ padding: "20px", color: "var(--gold)" }}>No data</div>;
  }

  const { client, programs } = profileData;

  return (
    <div style={{ padding: "40px", backgroundColor: "var(--black)", color: "var(--white)" }}>
      <h1 style={{ color: "var(--gold)", fontSize: "32px", marginBottom: "20px" }}>
        {client.name}
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <p><strong>Age:</strong> {client.age}</p>
        <p><strong>Height:</strong> {client.height}"</p>
        <p><strong>Weight:</strong> {client.weight} lbs</p>
        <p><strong>Goal:</strong> {client.goals}</p>
      </div>

      <h2 style={{ color: "var(--gold)", fontSize: "24px", marginTop: "30px", marginBottom: "15px" }}>
        Assigned Programs
      </h2>
      {programs && programs.length > 0 ? (
        <div>
          {programs.map((prog: any) => (
            <div key={prog.id} style={{ marginBottom: "15px", padding: "15px", backgroundColor: "var(--surface)", borderRadius: "8px" }}>
              <p><strong>{prog.name}</strong></p>
              <p style={{ color: "var(--muted)" }}>{prog.duration} weeks</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)" }}>No programs assigned yet</p>
      )}
    </div>
  );
}
