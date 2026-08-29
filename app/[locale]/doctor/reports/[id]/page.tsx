import type { Metadata } from "next";

export const metadata: Metadata = { title: "Medical Review" };

export default async function MedicalReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Medical Review</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Patient Inquiry #{id}</h2>
            <p className="text-xs text-gray-500">Triaged by Sarah Jenkins (Secretary)</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            Pending Doctor Review
          </span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          Patient reported fever and requested review of their latest prescription.
        </p>
      </div>
    </div>
  );
}