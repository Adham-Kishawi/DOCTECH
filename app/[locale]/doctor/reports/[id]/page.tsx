import type { Metadata } from "next";
export const metadata: Metadata = { title: "Medical Review" };
export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Medical Review</h1>
      <div className="card p-8 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>Report ID: {params.id} — Under development</p>
      </div>
    </div>
  );
}