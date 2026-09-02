import { redirect } from "next/navigation";

export default async function InviteRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/doctor/team`);
}
