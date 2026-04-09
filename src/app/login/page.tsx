import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-heading)] text-3xl text-ink">
            Freedom Ryder
          </h1>
          <p className="text-sm text-ink-muted mt-1 tracking-wider uppercase">
            Lead Tracker
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
