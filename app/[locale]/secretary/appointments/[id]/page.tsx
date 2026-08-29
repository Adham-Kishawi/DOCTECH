import type { Metadata } from "next";
export const metadata: Metadata = { title: "Appointment Details" };
export default async function AppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointment #{id} Details</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-600">Managing appointment details for ID: {id}</p>
      </div>
    </div>
  );
}