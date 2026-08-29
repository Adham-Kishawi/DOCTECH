export default function DoctorProfilePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#1A4B8C] text-white text-xl font-bold flex items-center justify-center">
            DR
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Dr. Clinical Lead</h2>
            <p className="text-xs text-gray-500">General Practice & Surgery • Al-Amal Clinic</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><span className="font-semibold text-gray-500">Email:</span> <p className="font-bold text-gray-900 mt-0.5">doctor@doctech.com</p></div>
          <div><span className="font-semibold text-gray-500">Phone:</span> <p className="font-bold text-gray-900 mt-0.5">+20 100 123 4567</p></div>
          <div><span className="font-semibold text-gray-500">Role:</span> <p className="font-bold text-gray-900 mt-0.5">Medical Lead (Admin)</p></div>
          <div><span className="font-semibold text-gray-500">License:</span> <p className="font-bold text-gray-900 mt-0.5">DOC-8921-EG</p></div>
        </div>
      </div>
    </div>
  );
}