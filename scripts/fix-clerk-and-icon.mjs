import fs from "node:fs";
import path from "node:path";

const roots = ["D:\\FULL-PROJECTS\\DOCTECK", "D:\\FULL-PROJECTS\\DOCTECH"];

// 1. UPDATE app/[locale]/page.tsx
const homePage = `import { cookies } from "next/headers";
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
    redirect(\`/\${locale}/doctor/dashboard\`);
  } else if (role === "secretary") {
    redirect(\`/\${locale}/secretary/dashboard\`);
  } else {
    redirect(\`/\${locale}/sign-in\`);
  }
}
`;

for (const root of roots) {
  fs.writeFileSync(path.join(root, "app", "[locale]", "page.tsx"), homePage, "utf8");

  // 2. UPDATE sign-in page to replace Sparkles with KeyRound
  const signInPath = path.join(root, "app", "[locale]", "(auth)", "sign-in", "page.tsx");
  let signInContent = fs.readFileSync(signInPath, "utf8");
  
  signInContent = signInContent.replace(
    'import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff, Sparkles } from "lucide-react";',
    'import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff, KeyRound } from "lucide-react";'
  );
  signInContent = signInContent.replace(
    '<Sparkles size={13} className="text-[#36ADA3]" />',
    '<KeyRound size={13} className="text-[#3368A0] dark:text-[#4B85C5]" />'
  );
  
  fs.writeFileSync(signInPath, signInContent, "utf8");
}

console.log("Fixed Clerk auth() runtime error in app/[locale]/page.tsx and replaced Sparkles with KeyRound icon in sign-in page");
