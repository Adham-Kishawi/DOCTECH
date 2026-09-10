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
  ShieldCheck,
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
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectSignedInUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (response.status === 403) {
        router.replace(`/${locale}/clinic-setup`);
        return;
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
    } catch (error) {
      console.error("Existing session redirect error:", error);

      toast.error(
        isRTL
          ? "تعذر تحديد حسابك"
          : "Unable to determine your account"
      );
    }
  };

  // If the user is already signed in, don't try to sign in again.
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
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      console.log("SIGN IN STATUS:", signIn.status);
      console.log("SIGN IN ERROR:", error);

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

      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor =
          signIn.supportedSecondFactors?.find(
            (factor) => factor.strategy === "email_code"
          );

        if (!emailCodeFactor) {
          throw new Error(
            isRTL
              ? "لا يتوفر التحقق عبر البريد الإلكتروني لهذا الحساب"
              : "Email verification is not available for this account"
          );
        }

        const { error: codeError } =
          await signIn.mfa.sendEmailCode();

        if (codeError) {
          throw new Error(
            codeError.longMessage ||
              codeError.message ||
              (isRTL
                ? "تعذر إرسال رمز التحقق"
                : "Unable to send verification code")
          );
        }

        setShowVerification(true);

        toast.success(
          isRTL
            ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
            : "A verification code has been sent to your email"
        );

        return;
      }

      if (signIn.status === "needs_second_factor") {
        throw new Error(
          isRTL
            ? "يتطلب هذا الحساب تحققًا إضافيًا"
            : "This account requires additional verification"
        );
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
            ? "تعذر تسجيل الدخول"
            : "Unable to sign in")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!signIn) return;

    if (!code.trim()) {
      toast.error(
        isRTL
          ? "أدخل رمز التحقق"
          : "Enter the verification code"
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await signIn.mfa.verifyEmailCode({
          code: code.trim(),
        });

      if (error) {
        toast.error(
          error.longMessage ||
            error.message ||
            (isRTL
              ? "رمز التحقق غير صحيح"
              : "Invalid verification code")
        );
        return;
      }

      if (signIn.status !== "complete") {
        throw new Error(
          isRTL
            ? "تعذر إكمال التحقق"
            : "Unable to complete verification"
        );
      }

      await completeSignIn();
    } catch (error: unknown) {
      console.error("Verification error:", error);

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
            ? "تعذر التحقق من الرمز"
            : "Unable to verify the code")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setPassword("");
    setCode("");
    setShowPassword(false);
    setShowVerification(false);
  };

  const handleBackToSignIn = () => {
    setCode("");
    setShowVerification(false);
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white dark:bg-[#131E2E]">
      {!showVerification ? (
        <>
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRTL ? "تسجيل الدخول" : "Welcome Back"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {isRTL
                ? "سجّل الدخول لإدارة عيادتك ومواعيدك ومرضاك"
                : "Sign in to manage your clinic appointments & patients"}
            </p>
          </div>

          {/* Credentials Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email-sign"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isRTL
                  ? "البريد الإلكتروني"
                  : "Email Address"}
              </label>

              <div className="relative">
                <Mail
                  className="doctech-input-icon"
                  size={17}
                />

                <input
                  type="email"
                  required
                  id="email-sign"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="doctor@doctech.com"
                  className="doctech-input bg-white dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark]"
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
                  {isRTL
                    ? "كلمة المرور"
                    : "Password"}
                </label>

                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-[#3368A0] dark:text-[#4B85C5] hover:underline font-semibold"
                >
                  {isRTL
                    ? "نسيت كلمة المرور؟"
                    : "Forgot Password?"}
                </Link>
              </div>

              <div className="relative">
                <Lock
                  className="doctech-input-icon"
                  size={17}
                />

                <input
                  id="pass-sign"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="doctech-input bg-white dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark]"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="doctech-input-action hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading || !authLoaded || isSignedIn}
              className="w-full mt-3 h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className={
                    isRTL
                      ? "rotate-180"
                      : ""
                  }
                />
              )}
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRTL ? "إعادة تعيين" : "Reset"}
            </button>
          </form>

          {/* Enterprise Handover Info */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck
              size={14}
              className="text-[#36ADA3]"
            />

            <span>
              {isRTL
                ? "يتم تزويد حسابات العيادات والأطباء مباشرة من إدارة النظام"
                : "Accounts are provisioned directly for medical practices"}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Verification Title */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#36ADA3]/10">
              <ShieldCheck
                size={24}
                className="text-[#36ADA3]"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRTL
                ? "تحقق من جهازك"
                : "Verify Your Device"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
              {isRTL
                ? "أرسلنا رمز تحقق إلى بريدك الإلكتروني لتأكيد هذا الجهاز."
                : "We sent a verification code to your email to verify this device."}
            </p>
          </div>

          {/* Verification Form */}
          <form
            onSubmit={handleVerification}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="verification-code"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isRTL
                  ? "رمز التحقق"
                  : "Verification Code"}
              </label>

              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                placeholder="000000"
                maxLength={6}
                className="doctech-input w-full bg-white dark:bg-[#131E2E] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-center tracking-[0.35em] font-bold [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <button
              type="submit"
              disabled={
                loading || !code.trim()
              }
              className="w-full h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? isRTL
                  ? "جاري التحقق..."
                  : "Verifying..."
                : isRTL
                  ? "تحقق وتابع"
                  : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={handleBackToSignIn}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRTL
                ? "العودة لتسجيل الدخول"
                : "Back to Sign In"}
            </button>
          </form>

          {/* Verification Info */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isRTL
              ? "تحقق من مجلد البريد العشوائي إذا لم تجد الرسالة."
              : "Check your spam folder if you don't see the email."}
          </div>
        </>
      )}
    </div>
  );
}