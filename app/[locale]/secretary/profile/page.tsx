export default function SecretaryProfilePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Secretary Profile</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#0891B2] text-white text-xl font-bold flex items-center justify-center">
            SJ
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Sarah Jenkins</h2>
            <p className="text-xs text-gray-500">Clinic Coordinator • Al-Amal Clinic</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><span className="font-semibold text-gray-500">Email:</span> <p className="font-bold text-gray-900 mt-0.5">sarah.j@doctech-clinic.com</p></div>
          <div><span className="font-semibold text-gray-500">Phone:</span> <p className="font-bold text-gray-900 mt-0.5">+20 101 234 5678</p></div>
          <div><span className="font-semibold text-gray-500">Status:</span> <p className="font-bold text-emerald-600 mt-0.5">Active</p></div>
          <div><span className="font-semibold text-gray-500">Assigned Doctor:</span> <p className="font-bold text-gray-900 mt-0.5">Dr. Clinical Lead</p></div>
        </div>
      </div>
    </div>
  );
}