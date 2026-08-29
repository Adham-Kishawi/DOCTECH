import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role === "doctor") {
    redirect(`/${locale}/doctor/dashboard`);
  } else if (role === "secretary") {
    redirect(`/${locale}/secretary/dashboard`);
  } else {
    redirect(`/${locale}/role-selection`);
  }
}