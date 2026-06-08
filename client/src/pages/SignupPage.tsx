import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-amber-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">W.A.R. COACHING</h1>
          <p className="text-gray-400">Watson Athletic Readiness</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
