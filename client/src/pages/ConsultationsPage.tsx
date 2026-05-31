import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ConsultationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    consultationType: "initial",
    amount: "0",
  });

  const { data: consultations } = trpc.consultations.list.useQuery();
  const createConsultation = trpc.consultations.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConsultation.mutateAsync({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      consultationType: formData.consultationType,
      amount: formData.amount,
    });
    setFormData({ clientName: "", clientEmail: "", clientPhone: "", consultationType: "initial", amount: "0" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gold">Consultations</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gold text-black font-bold rounded hover:bg-gold/90"
          >
            {showForm ? "Cancel" : "New Consultation"}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gold/20 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                  required
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="Client Phone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                />
                <select
                  value={formData.consultationType}
                  onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                >
                  <option value="initial">Initial Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="assessment">Assessment</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createConsultation.isPending}
                className="w-full px-4 py-2 bg-gold text-black font-bold rounded hover:bg-gold/90 disabled:opacity-50"
              >
                {createConsultation.isPending ? "Creating..." : "Create Consultation"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consultations?.map((c: any) => (
            <div key={c.id} className="bg-gray-900 rounded-lg p-6 border border-gold/20">
              <h3 className="text-xl font-bold text-gold mb-2">{c.clientName}</h3>
              <p className="text-gray-400 mb-2">{c.clientEmail}</p>
              <p className="text-gray-400 mb-4">{c.clientPhone}</p>
              <div className="flex justify-between items-center">
                <span className="text-gold font-semibold">${c.amount}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  c.status === "pending" ? "bg-yellow-900 text-yellow-200" :
                  c.status === "scheduled" ? "bg-blue-900 text-blue-200" :
                  c.status === "completed" ? "bg-green-900 text-green-200" :
                  "bg-gray-700 text-gray-200"
                }`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
