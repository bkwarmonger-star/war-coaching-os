import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function BrandPage() {
  const [formData, setFormData] = useState({
    bio: "",
    qualifications: "",
    specialties: "",
  });

  const { data: profileData } = trpc.trainer.getProfile.useQuery();

  const updateMutation = trpc.trainer.updateProfile.useMutation({
    onSuccess: () => {
      alert("Profile updated successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      bio: formData.bio,
      qualifications: formData.qualifications.split(",").map(q => q.trim()),
      specialties: formData.specialties.split(",").map(s => s.trim()),
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-bebas text-4xl mb-8" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
          TRAINER PROFILE
        </h1>

        <Card>
          <CardHeader>
            <h2 className="font-bebas text-xl" style={{ color: "var(--white)" }}>
              Customize Your Brand
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell clients about yourself..."
                  style={{
                    backgroundColor: "var(--surface2)",
                    borderColor: "var(--border)",
                    color: "var(--white)",
                  }}
                  className="border rounded px-4 py-3 font-rajdhani w-full"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>
                  Qualifications (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="e.g., NASM-CPT, Nutrition Specialist"
                  style={{
                    backgroundColor: "var(--surface2)",
                    borderColor: "var(--border)",
                    color: "var(--white)",
                  }}
                  className="border rounded px-4 py-2 font-rajdhani w-full"
                />
              </div>

              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>
                  Specialties (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="e.g., Strength Training, Fat Loss"
                  style={{
                    backgroundColor: "var(--surface2)",
                    borderColor: "var(--border)",
                    color: "var(--white)",
                  }}
                  className="border rounded px-4 py-2 font-rajdhani w-full"
                />
              </div>

              <Button variant="primary" type="submit" className="w-full">
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {profileData && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="font-bebas text-xl" style={{ color: "var(--white)" }}>
                Public Profile Preview
              </h2>
            </CardHeader>
            <CardBody>
              <div className="border-l-4" style={{ borderColor: "var(--gold)" }}>
                <div className="pl-6">
                  <h3 className="font-bebas text-2xl mb-2" style={{ color: "var(--gold)" }}>
                    Your Trainer Profile
                  </h3>
                  <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--white)" }}>
                    {formData.bio || "Your bio will appear here"}
                  </p>
                  {formData.qualifications && (
                    <div className="mb-4">
                      <p className="font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>
                        Qualifications
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.qualifications.split(",").map((q, i) => (
                          <span key={i} className="tag tag-gold">
                            {q.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.specialties && (
                    <div>
                      <p className="font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>
                        Specialties
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.split(",").map((s, i) => (
                          <span key={i} className="tag tag-gold">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
