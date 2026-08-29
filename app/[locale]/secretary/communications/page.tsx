import type { Metadata } from "next";
export const metadata: Metadata = { title: "Internal Communications" };
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Internal Communications</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Chat with the doctor</p>
      </div>
      <div className="card p-8 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>This screen is under active development</p>
      </div>
    </div>
  );
}