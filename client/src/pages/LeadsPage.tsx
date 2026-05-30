import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function LeadsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "referral",
    notes: "",
  });

  const { data: leadsData, refetch } = trpc.leads.list.useQuery({ limit: 50, offset: 0 });

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({ name: "", email: "", phone: "", source: "referral", notes: "" });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: formData.source,

      notes: formData.notes,
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            LEADS & REFERRALS
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Lead"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  >
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>

                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-2"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  Add Lead
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="space-y-4">
          {leadsData && leadsData.length > 0 ? (
            leadsData.map((lead: any) => (
              <Card key={lead.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bebas text-lg mb-2" style={{ color: "var(--gold)" }}>
                        {lead.name}
                      </h3>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                        {lead.email} | {lead.phone}
                      </p>
                      {lead.notes && (
                        <p className="font-rajdhani text-sm mt-2" style={{ color: "var(--white)" }}>
                          {lead.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="tag tag-gold">{lead.source}</span>
                      <span className="tag tag-blue">{lead.status}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                No leads yet. Start tracking prospective clients.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
