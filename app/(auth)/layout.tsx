import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-lg">{children}</div>
    </div>
  );
}
