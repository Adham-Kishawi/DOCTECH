"use client";

import { useEffect, useState } from "react";

type DoctorProfile = {
  id: string;
  email: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  clinic_id: string;
};

type Clinic = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
};

type ProfileResponse = {
  success: boolean;
  user: DoctorProfile;
  clinic: Clinic | null;
  schedules: Schedule[];
  error?: string;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/doctor/profile");
        const data: ProfileResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load doctor profile");
        }

        setProfile(data);
      } catch (err) {
        console.error("Load doctor profile error:", err);
        setError("Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-3xl min-h-[500px] flex items-center justify-center">
        <p className="text-sm text-white">Loading profile...</p>
      </div>
    </div>
  );
}

  if (error || !profile) {
    return (
      <div className="w-full flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-white">Doctor Profile</h1>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-red-500">
              {error || "Doctor profile not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const doctor = profile.user;
  const clinic = profile.clinic;

  const initials = doctor.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Doctor Profile</h1>

        {/* Doctor Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            {doctor.avatar_url ? (
              <img
                src={doctor.avatar_url}
                alt={doctor.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#1A4B8C] text-white text-xl font-bold flex items-center justify-center">
                {initials || "DR"}
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-gray-900">
                {doctor.name}
              </h2>

              <p className="text-xs text-gray-500">
                {doctor.specialty || "Doctor"}
                {clinic?.name ? ` • ${clinic.name}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-gray-500">Email:</span>
              <p className="font-bold text-gray-900 mt-0.5 break-all">
                {doctor.email}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">Phone:</span>
              <p className="font-bold text-gray-900 mt-0.5">
                {clinic?.phone || "Not provided"}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">Specialty:</span>
              <p className="font-bold text-gray-900 mt-0.5">
                {doctor.specialty || "Not provided"}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">Role:</span>
              <p className="font-bold text-gray-900 mt-0.5">Doctor</p>
            </div>
          </div>
        </div>

        {/* Clinic Information */}
        {clinic && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Clinic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500">
                  Clinic Name:
                </span>

                <p className="font-bold text-gray-900 mt-0.5">
                  {clinic.name}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-500">
                  Phone:
                </span>

                <p className="font-bold text-gray-900 mt-0.5">
                  {clinic.phone || "Not provided"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-500">
                  Address:
                </span>

                <p className="font-bold text-gray-900 mt-0.5">
                  {clinic.address || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Working Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Working Schedule
          </h2>

          {profile.schedules.length === 0 ? (
            <p className="text-xs text-gray-500">
              No working schedule configured.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {DAYS[schedule.day_of_week] || "Unknown day"}
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-gray-500">
                    {schedule.slot_duration} min / slot
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}