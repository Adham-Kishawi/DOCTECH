import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Doctor Sign Up" };
export default function SignUpPage() {
  return <div className="flex flex-col items-center"><SignUp /></div>;
}