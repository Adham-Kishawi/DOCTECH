import type { Metadata } from "next";
export const metadata: Metadata = { title: "Details" };
export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Details</h1>
      <div className="card p-8 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>ID: {params.id}</p>
      </div>
    </div>
  );
}