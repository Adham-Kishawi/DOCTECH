import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware((_, req) => {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|trpc|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};