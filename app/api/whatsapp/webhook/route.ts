// // import { NextResponse } from "next/server";
// // import { processHermesMessage } from "@/lib/ai/hermesAgent";
// // import { metaWhatsApp } from "@/lib/whatsapp/metaClient";

// // // 1. GET: Webhook verification endpoint for Meta Developers
// // export async function GET(request: Request) {
// //   try {
// //     const { searchParams } = new URL(request.url);
// //     const mode = searchParams.get("hub.mode");
// //     const token = searchParams.get("hub.verify_token");
// //     const challenge = searchParams.get("hub.challenge");

// //     const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
// //     if (!expectedToken) {
// //       console.error("[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set in environment.");
// //       return new NextResponse("Server configuration error", { status: 500 });
// //     }

// //     if (mode === "subscribe" && token && token === expectedToken) {
// //       console.log("WhatsApp Webhook verified successfully!");
// //       return new NextResponse(challenge, { status: 200 });
// //     }

// //     return new NextResponse("Forbidden: Verification token mismatch", { status: 403 });
// //   } catch (error) {
// //     console.error("Webhook GET error:", error);
// //     return new NextResponse("Internal Server Error", { status: 500 });
// //   }
// // }

// // // 2. POST: Ingest incoming WhatsApp messages -> AI Assistant -> Reply
// // export async function POST(request: Request) {
// //   try {
// //     const body = await request.json();

// //     // Validate Meta Cloud API Webhook payload structure
// //     const entry = body?.entry?.[0];
// //     const changes = entry?.changes?.[0];
// //     const value = changes?.value;
// //     const message = value?.messages?.[0];

// //     if (!message) {
// //       // Status update or read receipt event
// //       return NextResponse.json({ status: "acknowledged" });
// //     }

// //     const fromPhone = message.from; // e.g. "201001234567"
// //     const messageId = message.id;
// //     const messageText = message.text?.body || "";
// //     const senderName = value?.contacts?.[0]?.profile?.name || "Patient";

// //     console.log(`[WhatsApp Incoming] Message event received (id: ${messageId || "unknown"})`);

// //     // Mark message as read
// //     await metaWhatsApp.markAsRead(messageId);

// //     // Process via AI Assistant
// //     const hermesResult = await processHermesMessage({
// //       fromPhone,
// //       patientName: senderName,
// //       messageText,
// //     });

// //     // Send AI reply back via WhatsApp Cloud API
// //     await metaWhatsApp.sendTextMessage({
// //       to: fromPhone,
// //       text: hermesResult.replyText,
// //     });

// //     console.log(`[AI Reply Sent] To: ${fromPhone}, Intent: ${hermesResult.intent}`);

// //     return NextResponse.json({
// //       success: true,
// //       intent: hermesResult.intent,
// //       createdBookingRequest: hermesResult.createdBookingRequest,
// //     });
// //   } catch (error) {
// //     console.error("WhatsApp Webhook POST error:", error);
// //     return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
// //   }
// // }


// import { NextResponse } from "next/server";
// import { processHermesMessage } from "@/lib/ai/hermesAgent";
// import { metaWhatsApp } from "@/lib/whatsapp/metaClient";
// import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

// // 1. GET: Webhook verification endpoint for Meta Developers
// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const mode = searchParams.get("hub.mode");
//     const token = searchParams.get("hub.verify_token");
//     const challenge = searchParams.get("hub.challenge");

//     const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

//     if (!expectedToken) {
//       console.error(
//         "[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set in environment."
//       );

//       return new NextResponse("Server configuration error", {
//         status: 500,
//       });
//     }

//     if (mode === "subscribe" && token && token === expectedToken) {
//       console.log("WhatsApp Webhook verified successfully!");

//       return new NextResponse(challenge, {
//         status: 200,
//       });
//     }

//     return new NextResponse(
//       "Forbidden: Verification token mismatch",
//       {
//         status: 403,
//       }
//     );
//   } catch (error) {
//     console.error("Webhook GET error:", error);

//     return new NextResponse("Internal Server Error", {
//       status: 500,
//     });
//   }
// }

// // 2. POST: Ingest incoming WhatsApp messages -> AI Assistant -> Reply
// export async function POST(request: Request) {
//   try {
//     const body = await request.json();

//     // Validate Meta Cloud API Webhook payload structure
//     const entry = body?.entry?.[0];
//     const changes = entry?.changes?.[0];
//     const value = changes?.value;
//     const message = value?.messages?.[0];

//     if (!message) {
//       // Status update or read receipt event
//       return NextResponse.json({
//         status: "acknowledged",
//       });
//     }

//     // WhatsApp number that received this message.
//     // This identifies the clinic/tenant.
//     const phoneNumberId = value?.metadata?.phone_number_id;

//     if (!phoneNumberId) {
//       console.error(
//         "[WhatsApp Webhook] Missing phone_number_id"
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error: "Missing WhatsApp phone number ID",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     // Resolve the clinic and its WhatsApp credentials
//     const { data: whatsappConfig, error: configError } =
//       await supabase
//         .from("whatsapp_configs")
//         .select("clinic_id, phone_number_id, access_token")
//         .eq("phone_number_id", phoneNumberId)
//         .maybeSingle();

//     if (configError) {
//       console.error(
//         "[WhatsApp Webhook] Config lookup error:",
//         configError
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error: "Failed to resolve WhatsApp configuration",
//         },
//         {
//           status: 500,
//         }
//       );
//     }

//     if (!whatsappConfig) {
//       console.error(
//         `[WhatsApp Webhook] No clinic configured for phone_number_id: ${phoneNumberId}`
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error: "WhatsApp number is not configured",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const clinicId = whatsappConfig.clinic_id;

//     const whatsappCredentials = {
//       phoneNumberId: whatsappConfig.phone_number_id,
//       accessToken: whatsappConfig.access_token,
//     };

//     const fromPhone = message.from;
//     const messageId = message.id;
//     const messageText = message.text?.body || "";
//     const senderName =
//       value?.contacts?.[0]?.profile?.name || "Patient";

//     console.log(
//       `[WhatsApp Incoming] Message event received (id: ${messageId || "unknown"
//       }, clinic: ${clinicId})`
//     );

//     // Mark message as read using this clinic's WhatsApp credentials
//     await metaWhatsApp.markAsRead(
//       messageId,
//       whatsappCredentials
//     );

//     // Process via AI Assistant
//     const hermesResult = await processHermesMessage({
//       fromPhone,
//       patientName: senderName,
//       messageText,
//     });

//     // Send AI reply using the same clinic's WhatsApp credentials
//     await metaWhatsApp.sendTextMessage({
//       to: fromPhone,
//       text: hermesResult.replyText,
//       credentials: whatsappCredentials,
//     });

//     console.log(
//       `[AI Reply Sent] To: ${fromPhone}, Intent: ${hermesResult.intent}, Clinic: ${clinicId}`
//     );

//     return NextResponse.json({
//       success: true,
//       intent: hermesResult.intent,
//       createdBookingRequest:
//         hermesResult.createdBookingRequest,
//     });
//   } catch (error) {
//     console.error(
//       "WhatsApp Webhook POST error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Webhook processing failed",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { processHermesMessage } from "@/lib/ai/hermesAgent";
import { metaWhatsApp } from "@/lib/whatsapp/metaClient";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notificationService";
import { getAvailableSlots } from "@/lib/schedule/availabilityService";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return `20${digits.slice(1)}`;
  }

  return digits;
}

// 1. GET: Webhook verification endpoint for Meta Developers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!expectedToken) {
      console.error(
        "[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set in environment."
      );

      return new NextResponse("Server configuration error", {
        status: 500,
      });
    }

    if (mode === "subscribe" && token && token === expectedToken) {
      console.log("WhatsApp Webhook verified successfully!");

      return new NextResponse(challenge, {
        status: 200,
      });
    }

    return new NextResponse("Forbidden: Verification token mismatch", {
      status: 403,
    });
  } catch (error) {
    console.error("Webhook GET error:", error);

    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}

// 2. POST: Incoming WhatsApp message -> AI -> booking -> reply
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ---------------------------------------------------------
    // Validate Meta Cloud API Webhook payload
    // ---------------------------------------------------------

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({
        status: "acknowledged",
      });
    }

    // ---------------------------------------------------------
    // Resolve clinic from the WhatsApp number
    // ---------------------------------------------------------

    const phoneNumberId = value?.metadata?.phone_number_id;

    if (!phoneNumberId) {
      console.error("[WhatsApp Webhook] Missing phone_number_id");

      return NextResponse.json(
        {
          success: false,
          error: "Missing WhatsApp phone number ID",
        },
        {
          status: 400,
        }
      );
    }

    const { data: whatsappConfig, error: configError } =
      await supabase
        .from("whatsapp_configs")
        .select("clinic_id, phone_number_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();

    if (configError) {
      console.error(
        "[WhatsApp Webhook] Config lookup error:",
        configError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to resolve WhatsApp configuration",
        },
        {
          status: 500,
        }
      );
    }

    if (!whatsappConfig) {
      console.error(
        `[WhatsApp Webhook] No clinic configured for phone_number_id: ${phoneNumberId}`
      );

      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp number is not configured",
        },
        {
          status: 404,
        }
      );
    }

    const clinicId = whatsappConfig.clinic_id;

    const whatsappCredentials = {
      phoneNumberId: whatsappConfig.phone_number_id,
      accessToken: whatsappConfig.access_token,
    };

    // ---------------------------------------------------------
    // Incoming message data
    // ---------------------------------------------------------

    const fromPhone = message.from;
    const messageId = message.id;
    const messageText = message.text?.body || "";
    const senderName =
      value?.contacts?.[0]?.profile?.name || "Patient";

    const normalizedPhone = normalizePhone(fromPhone);

    console.log(
      `[WhatsApp Incoming] Message event received (id: ${
        messageId || "unknown"
      }, clinic: ${clinicId})`
    );

    // ---------------------------------------------------------
    // Resolve patient inside the current clinic
    // ---------------------------------------------------------

    const { data: patients, error: patientLookupError } =
      await supabase
        .from("patients")
        .select("id, name, phone")
        .eq("clinic_id", clinicId);

    if (patientLookupError) {
      console.error(
        "[WhatsApp Webhook] Patient lookup error:",
        patientLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to resolve patient",
        },
        {
          status: 500,
        }
      );
    }

    const existingPatient = (patients || []).find(
      (patient) =>
        normalizePhone(patient.phone || "") === normalizedPhone
    );

    let patientId = existingPatient?.id;

    if (!patientId) {
      patientId = crypto.randomUUID();

      const { error: patientCreateError } = await supabase
        .from("patients")
        .insert([
          {
            id: patientId,
            name: senderName,
            phone: normalizedPhone,
            clinic_id: clinicId,
          },
        ]);

      if (patientCreateError) {
        console.error(
          "[WhatsApp Webhook] Patient creation error:",
          patientCreateError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Failed to create patient",
          },
          {
            status: 500,
          }
        );
      }

      console.log(
        `[WhatsApp Patient] New patient created: ${patientId}, Clinic: ${clinicId}`
      );
    } else {
      console.log(
        `[WhatsApp Patient] Existing patient resolved: ${patientId}, Clinic: ${clinicId}`
      );
    }

    // ---------------------------------------------------------
    // Mark WhatsApp message as read
    // ---------------------------------------------------------

    await metaWhatsApp.markAsRead(
      messageId,
      whatsappCredentials
    );

    // ---------------------------------------------------------
    // Process message with Hermes
    // ---------------------------------------------------------

    const hermesResult = await processHermesMessage({
      fromPhone: normalizedPhone,
      patientName: existingPatient?.name || senderName,
      messageText,
    });

    // This starts with Hermes' response.
    // The webhook may override it based on the real booking state.
    let replyText = hermesResult.replyText;

    // ---------------------------------------------------------
    // Resolve doctor and check requested appointment slot
    // ---------------------------------------------------------

    let bookingReady = false;
    let slotChecked = false;

    let selectedDoctor:
      | {
          id: string;
          name: string;
          specialty: string | null;
        }
      | undefined;

    const preferredDate =
      hermesResult.extractedDetails?.preferredDate;

    const preferredTime =
      hermesResult.extractedDetails?.preferredTime;

    const isBookingIntent =
      hermesResult.intent === "BOOKING_REQUEST";

    if (isBookingIntent && preferredDate && preferredTime) {
      const { data: doctors, error: doctorsError } =
        await supabase
          .from("doctors")
          .select("id, name, specialty")
          .eq("clinic_id", clinicId);

      if (doctorsError) {
        console.error(
          "[WhatsApp Booking] Doctor lookup error:",
          doctorsError
        );

        replyText =
          "حصلت مشكلة أثناء مراجعة بيانات الحجز. ممكن تحاول مرة تانية بعد شوية؟";
      } else if (!doctors || doctors.length === 0) {
        console.warn(
          `[WhatsApp Booking] No doctors found for clinic: ${clinicId}`
        );

        replyText =
          "حالياً مش قادرين نكمل طلب الحجز، لأن مفيش دكتور متاح للحجز في العيادة. ممكن تحاول مرة تانية بعد شوية؟";
      } else {
        // Current clinic flow uses the clinic's doctor.
        // Multi-doctor selection can be added later.
        selectedDoctor = doctors[0];

        try {
          const availableSlots = await getAvailableSlots(
            selectedDoctor.id,
            preferredDate
          );

          slotChecked = true;

          const requestedSlot = availableSlots.find(
            (slot) => slot.startTime === preferredTime
          );

          if (requestedSlot?.isAvailable) {
            bookingReady = true;

            console.log(
              `[WhatsApp Booking] Slot available: ${preferredDate} ${preferredTime}, Doctor: ${selectedDoctor.id}`
            );
          } else {
            console.log(
              `[WhatsApp Booking] Slot unavailable: ${preferredDate} ${preferredTime}, Doctor: ${selectedDoctor.id}`
            );

            replyText =
              `للأسف الموعد ${preferredDate} الساعة ${preferredTime} غير متاح حالياً. ممكن تختار وقت أو موعد تاني؟`;
          }
        } catch (slotError) {
          console.error(
            "[WhatsApp Booking] Availability check error:",
            slotError
          );

          replyText =
            "حصلت مشكلة أثناء التحقق من مواعيد الحجز. ممكن تحاول مرة تانية بعد شوية؟";
        }
      }
    }

    // ---------------------------------------------------------
    // Create WhatsApp appointment request
    // ---------------------------------------------------------

    let appointmentId: string | undefined;

    if (bookingReady && selectedDoctor) {
      const symptoms =
        hermesResult.extractedDetails?.symptoms;

      const appointmentDate = new Date(
        `${preferredDate}T${preferredTime}:00`
      );

      if (Number.isNaN(appointmentDate.getTime())) {
        console.error(
          "[WhatsApp Booking] Invalid appointment date:",
          preferredDate,
          preferredTime
        );

        bookingReady = false;

        replyText =
          "حصلت مشكلة في بيانات الموعد. ممكن تحدد اليوم والساعة مرة تانية؟";
      } else {
        const newAppointmentId = crypto.randomUUID();

        const { error: appointmentError } =
          await supabase
            .from("appointments")
            .insert([
              {
                id: newAppointmentId,
                patient_id: patientId,
                doctor_id: selectedDoctor.id,
                clinic_id: clinicId,
                date: appointmentDate.toISOString(),
                duration: 30,
                status: "SCHEDULED",
                source: "WHATSAPP",
                booking_status: "PENDING_REVIEW",
                type: "WhatsApp Consultation",
                notes: symptoms || null,
                fee: 400,
                amount_paid: 0,
                payment_method: "CASH",
              },
            ]);

        if (appointmentError) {
          console.error(
            "[WhatsApp Booking] Appointment creation error:",
            appointmentError
          );

          bookingReady = false;

          replyText =
            "حصلت مشكلة أثناء تسجيل طلب الحجز. ممكن تحاول مرة تانية بعد شوية؟";
        } else {
          appointmentId = newAppointmentId;

          console.log(
            `[WhatsApp Booking] Appointment created: ${appointmentId}, Clinic: ${clinicId}, Doctor: ${selectedDoctor.id}, Patient: ${patientId}`
          );

          // -----------------------------------------------------
          // Notify secretary
          // -----------------------------------------------------

          try {
            await createNotification({
              clinicId,
              role: "secretary",
              type: "AI_BOOKING_REQUEST",
              title: "New WhatsApp Booking Request",
              titleAr: "طلب حجز جديد عبر واتساب",
              body: `${existingPatient?.name || senderName} requested an appointment on ${preferredDate} at ${preferredTime}.`,
              bodyAr: `${existingPatient?.name || senderName} طلب حجز موعد يوم ${preferredDate} الساعة ${preferredTime}.`,
              link: "appointments/pending",
            });
          } catch (notificationError) {
            console.warn(
              "[WhatsApp Booking] Notification creation failed:",
              notificationError
            );
          }

          // -----------------------------------------------------
          // Final reply only after appointment is actually created
          // -----------------------------------------------------

          replyText =
            `تم استلام طلب حجزك يوم ${preferredDate} الساعة ${preferredTime}، والطلب حالياً بانتظار مراجعة وتأكيد الاستقبال.`;
        }
      }
    }

    // ---------------------------------------------------------
    // Send final WhatsApp reply
    // ---------------------------------------------------------

    await metaWhatsApp.sendTextMessage({
      to: fromPhone,
      text: replyText,
      credentials: whatsappCredentials,
    });

    console.log(
      `[AI Reply Sent] To: ${fromPhone}, Intent: ${hermesResult.intent}, Clinic: ${clinicId}, Patient: ${patientId}`
    );

    // ---------------------------------------------------------
    // Final response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      intent: hermesResult.intent,
      createdBookingRequest: Boolean(appointmentId),
      clinicId,
      patientId,
      bookingReady,
      slotChecked,
      appointmentId: appointmentId || null,
      doctorId: selectedDoctor?.id || null,
    });
  } catch (error) {
    console.error("WhatsApp Webhook POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
}