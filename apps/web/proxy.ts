import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/mind-auth";
import { withBasePath } from "@/lib/base-path";

const handleAuth = auth.middleware({
  loginUrl: withBasePath("/auth/sign-in")
});

export default function proxy(request: NextRequest) {
  return handleAuth(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg|.*\\..*).*)"]
};
