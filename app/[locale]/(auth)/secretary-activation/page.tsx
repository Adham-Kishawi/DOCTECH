import type { Metadata } from "next";
export const metadata: Metadata = { title: "Secretary Activation" };
export default function Page() {
  return (
    <div className="card p-8">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Secretary Activation</h1>
      <p style={{ color: "var(--color-text-muted)" }}>Under development</p>
    </div>
  );
}