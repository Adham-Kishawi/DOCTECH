import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const role = cookieStore.get("doctech_role")?.value;

  if (role === "doctor") {
    redirect(`/${locale}/doctor/dashboard`);
  } else if (role === "secretary") {
    redirect(`/${locale}/secretary/dashboard`);
  } else {
    redirect(`/${locale}/sign-in`);
  }
}
