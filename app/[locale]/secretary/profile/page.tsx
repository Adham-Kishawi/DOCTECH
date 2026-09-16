
"use client";

import { useEffect, useState } from "react";

interface Secretary {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  phone: string | null;
  permissions: string[];
  avatar_url: string | null;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  clinic_id: string;
}

export default function SecretaryProfilePage() {
  const [secretary, setSecretary] = useState<Secretary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success || data.role !== "secretary") {
          throw new Error(
            data.error || "Failed to load secretary profile"
          );
        }

        setSecretary(data.user);
      } catch (err) {
        console.error("Load secretary profile error:", err);
        setError("Failed to load secretary profile");
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

  if (error || !secretary) {
    return (
      <div className="w-full flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold text-white">
            Secretary Profile
          </h1>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-red-500">
              {error || "Secretary profile not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = secretary.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const statusLabel =
    secretary.status.charAt(0) +
    secretary.status.slice(1).toLowerCase();

  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-white">
          Secretary Profile
        </h1>

        {/* Secretary Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            {secretary.avatar_url ? (
              <img
                src={secretary.avatar_url}
                alt={secretary.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#36ADA3] text-white text-xl font-bold flex items-center justify-center">
                {initials || "SC"}
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-gray-900">
                {secretary.name}
              </h2>

              <p className="text-xs text-gray-500">
                Secretary • DOCTECH Clinic
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-gray-500">
                Email:
              </span>

              <p className="font-bold text-gray-900 mt-0.5 break-all">
                {secretary.email}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">
                Phone:
              </span>

              <p className="font-bold text-gray-900 mt-0.5">
                {secretary.phone || "Not provided"}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">
                Status:
              </span>

              <p
                className={`font-bold mt-0.5 ${
                  secretary.status === "ACTIVE"
                    ? "text-emerald-600"
                    : secretary.status === "PENDING"
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                {statusLabel}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">
                Role:
              </span>

              <p className="font-bold text-gray-900 mt-0.5">
                Secretary
              </p>
            </div>
          </div>
        </div>

        {/* Clinic Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Clinic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-gray-500">
                Clinic ID:
              </span>

              <p className="font-bold text-gray-900 mt-0.5 break-all">
                {secretary.clinic_id}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-500">
                Status:
              </span>

              <p className="font-bold text-gray-900 mt-0.5">
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Permissions
          </h2>

          {secretary.permissions.length === 0 ? (
            <p className="text-xs text-gray-500">
              No permissions assigned.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {secretary.permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 text-[#36ADA3] text-xs font-semibold"
                >
                  {permission}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}