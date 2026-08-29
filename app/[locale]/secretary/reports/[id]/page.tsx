import type { Metadata } from "next";
export const metadata: Metadata = { title: "Report Detail & Triage" };
export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Report #{id} & Triage</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-600">Triage incoming patient report #{id} and send to Doctor</p>
      </div>
    </div>
  );
}