import crypto from "node:crypto";
import fs from "node:fs";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { supabaseMcp } from "./supabase.js";

const ENV_FILE = "C:\\saeed work\\DOCTECH\\.env.local";
const TENANT_TOKEN_MAX_AGE_SECONDS = 30 * 60;

function readEnvValue(name: string): string {
  try {
    const content = fs.readFileSync(ENV_FILE, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key === name) {
        return value;
      }
    }
  } catch {
    return "";
  }

  return "";
}

function verifyTenantToken(token: string) {
  const parts = token.split("|");

  if (parts.length !== 4) {
    throw new Error("Invalid tenant token format.");
  }

  const [botId, clinicId, timestampText, signature] = parts;

  if (!botId || !clinicId || !timestampText || !signature) {
    throw new Error("Invalid tenant token.");
  }

  const timestamp = Number(timestampText);

  if (!Number.isInteger(timestamp)) {
    throw new Error("Invalid tenant token timestamp.");
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const tokenAge = Math.abs(currentTimestamp - timestamp);
  
  fs.appendFileSync(
  "C:\\saeed work\\DOCTECH\\mcp\\token-debug.log",
  `[DOCTECH MCP] tokenAge=${tokenAge}s maxAge=${TENANT_TOKEN_MAX_AGE_SECONDS}s\n`,
  "utf8"
);

  if (tokenAge > TENANT_TOKEN_MAX_AGE_SECONDS) {
    throw new Error("Tenant token expired.");
  }

  const secret = readEnvValue("DOCTECH_HERMES_TENANT_SECRET");

  if (!secret) {
    throw new Error("Tenant verification secret is not configured.");
  }

  const message = `${botId}|${clinicId}|${timestamp}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex");

  const providedSignature = Buffer.from(signature, "utf8");
  const expectedSignatureBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(
      providedSignature,
      expectedSignatureBuffer
    )
  ) {
    throw new Error("Invalid tenant token signature.");
  }

  return {
    botId,
    clinicId,
  };
}

interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  doctorId: string;
  date: string;
}

interface AppointmentRecord {
  date: string;
  duration: number;
  status: string;
  booking_status: string;
}

const ACTIVE_APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
];

function getDayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

function formatDisplayTime(time: string): string {
  const [hoursString, minutes] = time.split(":");
  const hours = Number(hoursString);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
}

async function getAvailableSlotsForMcp(
  doctorId: string,
  date: string
): Promise<AvailableSlot[]> {
  const dayOfWeek = getDayOfWeek(date);

  const { data: schedule, error: scheduleError } = await supabaseMcp
    .from("doctor_schedules")
    .select(
      "day_of_week, start_time, end_time, slot_duration, is_active"
    )
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  const defaultSchedule = {
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
    is_active: true,
  };

  const activeSchedule =
    schedule && schedule.is_active
      ? schedule
      : defaultSchedule;

  const startMinutes = timeToMinutes(activeSchedule.start_time);
  const endMinutes = timeToMinutes(activeSchedule.end_time);
  const slotDuration = activeSchedule.slot_duration || 30;

  const { data: appointments, error: appointmentsError } =
    await supabaseMcp
      .from("appointments")
      .select("date, duration, status, booking_status")
      .eq("doctor_id", doctorId)
      .gte("date", `${date}T00:00:00`)
      .lt("date", `${date}T23:59:59.999`);

  if (appointmentsError) {
    throw new Error(appointmentsError.message);
  }

  const activeAppointments: AppointmentRecord[] = (
    appointments ?? []
  ).filter(
    (appointment) =>
      ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status) &&
      appointment.booking_status !== "REJECTED"
  );

  const slots: AvailableSlot[] = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes + slotDuration <= endMinutes;
    currentMinutes += slotDuration
  ) {
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + slotDuration;

    const isBooked = activeAppointments.some((appointment) => {
      const appointmentDate = new Date(appointment.date);

      const appointmentStart =
        appointmentDate.getHours() * 60 +
        appointmentDate.getMinutes();

      const appointmentEnd =
        appointmentStart + appointment.duration;

      return (
        appointmentStart < slotEnd &&
        appointmentEnd > slotStart
      );
    });

    const startTime = minutesToTime(slotStart);
    const endTime = minutesToTime(slotEnd);

    slots.push({
      time: formatDisplayTime(startTime),
      startTime,
      endTime,
      isAvailable: !isBooked,
      doctorId,
      date,
    });
  }

  return slots;
}

const server = new McpServer({
  name: "doctech-mcp",
  version: "1.0.0",
});

server.registerTool(
  "doctech_health",
  {
    description: "Check that the DOCTECH MCP server is running.",
  },
  async () => ({
    content: [
      {
        type: "text",
        text: "DOCTECH MCP server is running.",
      },
    ],
  })
);

server.registerTool(
  "doctech_verify_tenant",
  {
    description:
      "Verify the trusted DOCTECH tenant context generated from the WhatsApp bot identity.",
    inputSchema: z.object({
      tenantToken: z
        .string()
        .min(1)
        .describe("Trusted tenant token generated by DOCTECH."),
    }),
  },
  async ({ tenantToken }) => {
    try {
      const tenant = verifyTenantToken(tenantToken);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              clinicId: tenant.clinicId,
              botId: tenant.botId,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Tenant verification failed.",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "doctech_get_clinic_info",
  {
    description:
      "Get the real clinic information for the trusted WhatsApp tenant. Never accept or invent a clinic ID; it is derived from the verified tenant token.",
    inputSchema: z.object({
      tenantToken: z
        .string()
        .min(1)
        .describe("Trusted tenant token generated by DOCTECH."),
    }),
  },
  async ({ tenantToken }) => {
    try {
      const tenant = verifyTenantToken(tenantToken);

      const { data, error } = await supabaseMcp
        .from("clinics")
        .select(
          "id, name, phone, address, logo_url, clerk_org_id"
        )
        .eq("id", tenant.clinicId)
        .maybeSingle();

      if (error) {
        console.error("DOCTECH clinic lookup error:", error);
        throw new Error(
          "Failed to load clinic information."
        );
      }

      if (!data) {
        throw new Error("Clinic not found.");
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              clinic: data,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load clinic information.",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "doctech_get_available_slots",
  {
    description:
      "Get real available appointment slots for the doctor associated with the trusted WhatsApp clinic. The doctor is resolved automatically from the verified tenant context; never ask the patient for a doctor ID.",
    inputSchema: z.object({
      tenantToken: z
        .string()
        .min(1)
        .describe("Trusted tenant token generated by DOCTECH."),
      date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          "Date must be YYYY-MM-DD."
        )
        .describe("Appointment date in YYYY-MM-DD format."),
    }),
  },
  async ({ tenantToken, date }) => {
    try {
      const tenant = verifyTenantToken(tenantToken);

      const { data: doctors, error: doctorsError } =
        await supabaseMcp
          .from("doctors")
          .select("id, name, specialty")
          .eq("clinic_id", tenant.clinicId);

      if (doctorsError) {
        console.error(
          "DOCTECH doctors lookup error:",
          doctorsError
        );

        throw new Error("Failed to load clinic doctor.");
      }

      if (!doctors || doctors.length === 0) {
        throw new Error(
          "No doctor is configured for the trusted WhatsApp clinic."
        );
      }

      if (doctors.length > 1) {
        throw new Error(
          "Multiple doctors are configured for this WhatsApp clinic."
        );
      }

      const doctor = doctors[0];

      const slots = await getAvailableSlotsForMcp(
        doctor.id,
        date
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              clinicId: tenant.clinicId,
              doctor: {
                id: doctor.id,
                name: doctor.name,
                specialty: doctor.specialty,
              },
              date,
              slots,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load available slots.",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();

async function main() {
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});