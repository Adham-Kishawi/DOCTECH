"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const params = useParams();
  const router = useRouter();

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();

  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA / Verification code state (if needed)
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendingCode, setResendingCode] = useState(false);

  const redirectSignedInUser = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();

      if (response.status === 403) {
        router.replace(`/${locale}/clinic-setup`);
        return;
      }

      // If 401 right after sign-in, wait briefly for session cookie sync and retry
      if (response.status === 401 && retryCount < 2) {
        await new Promise((r) => setTimeout(r, 600));
        return redirectSignedInUser(retryCount + 1);
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isRTL
              ? "تعذر التحقق من حساب DOCTECH"
              : "Unable to verify your DOCTECH account")
        );
      }

      router.replace(`/${locale}/${data.role}/dashboard`);
    } catch (error: any) {
      console.error("Existing session redirect error:", error);
      toast.error(
        error?.message ||
          (isRTL
            ? "تعذر تحديد حسابك"
            : "Unable to determine your account")
      );
    }
  };

  // If the user is already signed in, redirect them
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;

    setLoading(true);
    redirectSignedInUser().finally(() => {
      setLoading(false);
    });
  }, [authLoaded, isSignedIn]);

  const completeSignIn = async () => {
    if (!signIn) return;

    await signIn.finalize();
    await redirectSignedInUser();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signIn) {
      toast.error(
        isRTL
          ? "خدمة تسجيل الدخول غير جاهزة"
          : "Sign in is not ready yet"
      );
      return;
    }

    setLoading(true);

    try {
      // 1. First attempt: Direct secure token sign-in (eliminates 2FA roadblocks & session errors)
      const tokenRes = await fetch("/api/auth/sign-in-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.success && tokenData.token) {
          const { error: ticketError } = await signIn.ticket({
            ticket: tokenData.token,
          });

          if (ticketError) {
            throw new Error(ticketError.message || "Ticket sign in failed");
          }

          await completeSignIn();
          return;
        }
      }

      // 2. Fallback: Standard Clerk password flow
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        const errorMessage =
          error.longMessage ||
          error.message ||
          (isRTL
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Invalid email or password");

        toast.error(errorMessage);
        return;
      }

      if (signIn.status === "complete") {
        await completeSignIn();
        return;
      }

      // If 2FA / email code is requested
      if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        setStep("mfa");
        // Trigger email code dispatch if available
        try {
          await signIn.mfa?.sendEmailCode?.();
        } catch {
          // ignore if already dispatched
        }
        toast.info(
          isRTL
            ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
            : "Verification code sent to your email"
        );
        return;
      }

      throw new Error(
        isRTL
          ? "تعذر إكمال تسجيل الدخول"
          : "Unable to complete sign in"
      );
    } catch (error: unknown) {
      console.error("Sign in error:", error);

      const message =
        error &&
        typeof error === "object" &&
        "longMessage" in error &&
        typeof error.longMessage === "string"
          ? error.longMessage
          : error instanceof Error
            ? error.message
            : null;

      toast.error(
        message ||
          (isRTL
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Invalid email or password")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !verificationCode.trim()) return;

    setLoading(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        toast.error(
          error.message ||
            (isRTL ? "رمز التحقق غير صحيح" : "Invalid verification code")
        );
        return;
      }

      if (signIn.status === "complete") {
        await completeSignIn();
        return;
      }

      throw new Error("Verification incomplete");
    } catch (err: any) {
      toast.error(
        err.message ||
          (isRTL ? "تعذر التحقق من الرمز" : "Failed to verify code")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn) return;
    setResendingCode(true);
    try {
      await signIn.mfa.sendEmailCode();
      toast.success(
        isRTL
          ? "تمت إعادة إرسال رمز التحقق"
          : "Verification code resent successfully"
      );
    } catch {
      toast.error(
        isRTL ? "تعذر إعادة إرسال الرمز" : "Failed to resend code"
      );
    } finally {
      setResendingCode(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setPassword("");
    setVerificationCode("");
    setStep("credentials");
  };

  return (
    <div className="w-full relative">
      {/* Ambient background glow behind card */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/25 via-teal-500/20 to-indigo-600/25 rounded-[32px] blur-xl opacity-80 dark:opacity-40 pointer-events-none transition-all duration-500" />

      {/* Main Stylish Card Container */}
      <div className="relative w-full bg-white/95 dark:bg-[#111C2A]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-blue-950/10 dark:shadow-black/60 transition-all">
        {/* Header with Icon */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-[#3368A0] dark:text-[#4B85C5] mb-3.5 shadow-inner">
            {step === "credentials" ? (
              <Lock size={22} className="text-[#3368A0] dark:text-[#4B85C5]" />
            ) : (
              <KeyRound size={22} className="text-[#3368A0] dark:text-[#4B85C5]" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {step === "credentials"
              ? isRTL
                ? "تسجيل الدخول"
                : "Sign In to DOCTECH"
              : isRTL
                ? "رمز التحقق"
                : "Verification Code"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {step === "credentials"
              ? isRTL
                ? "سجل دخولك كطبيب أو سكرتير لمتابعة أعمال العيادة"
                : "Access your clinical workspace as a Doctor or Secretary"
              : isRTL
                ? `أدخل رمز التحقق المرسل إلى: ${email}`
                : `Enter the code sent to: ${email}`}
          </p>
        </div>

        {step === "credentials" ? (
          /* Step 1: Main Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email-sign"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isRTL ? "البريد الإلكتروني" : "Email Address"}
              </label>

              <div className="relative">
                <Mail className="doctech-input-icon" size={17} />

                <input
                  type="email"
                  required
                  id="email-sign"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@doctech.com"
                  className="doctech-input bg-slate-50/50 dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 focus:border-[#3368A0] dark:focus:border-[#4B85C5] focus:ring-2 focus:ring-[#3368A0]/20 rounded-xl"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="pass-sign"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>

                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-[#3368A0] dark:text-[#4B85C5] hover:underline font-semibold"
                >
                  {isRTL ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </Link>
              </div>

              <div className="relative">
                <Lock className="doctech-input-icon" size={17} />

                <input
                  id="pass-sign"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="doctech-input bg-slate-50/50 dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 focus:border-[#3368A0] dark:focus:border-[#4B85C5] focus:ring-2 focus:ring-[#3368A0]/20 rounded-xl"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="doctech-input-action hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !authLoaded || isSignedIn}
              className="w-full mt-3 h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? isRTL
                    ? "جاري الدخول..."
                    : "Signing In..."
                  : isRTL
                    ? "تسجيل الدخول"
                    : "Sign In"}
              </span>

              {!loading && (
                <ArrowRight
                  size={16}
                  className={isRTL ? "rotate-180" : ""}
                />
              )}
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 text-sm font-medium transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRTL ? "إعادة تعيين" : "Reset"}
            </button>
          </form>
        ) : (
          /* Step 2: 2FA Verification Code Form */
          <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div>
              <label
                htmlFor="mfa-code"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isRTL ? "رمز التحقق المكون من 6 أرقام" : "6-Digit Verification Code"}
              </label>

              <div className="relative">
                <KeyRound className="doctech-input-icon" size={17} />

                <input
                  type="text"
                  required
                  id="mfa-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="doctech-input tracking-widest text-center text-lg font-mono bg-slate-50/50 dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 focus:border-[#3368A0] dark:focus:border-[#4B85C5] focus:ring-2 focus:ring-[#3368A0]/20 rounded-xl"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full mt-3 h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? isRTL
                    ? "جاري التحقق..."
                    : "Verifying..."
                  : isRTL
                    ? "تأكيد الرمز والدخول"
                    : "Verify & Sign In"}
              </span>

              {!loading && (
                <ArrowRight
                  size={16}
                  className={isRTL ? "rotate-180" : ""}
                />
              )}
            </button>

            {/* Resend Code & Back */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendingCode || loading}
                className="flex-1 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={resendingCode ? "animate-spin" : ""} />
                <span>
                  {resendingCode
                    ? isRTL
                      ? "جاري الإرسال..."
                      : "Resending..."
                    : isRTL
                      ? "إعادة إرسال الرمز"
                      : "Resend Code"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                disabled={loading}
                className="flex-1 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <ArrowLeft size={13} className={isRTL ? "rotate-180" : ""} />
                <span>{isRTL ? "الرجوع" : "Back"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}