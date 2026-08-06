"use client";

import { createAuthClient } from "@neondatabase/auth";
import { withBasePath } from "@/lib/base-path";

export function getAuthClient() {
  return createAuthClient(`${window.location.origin}${withBasePath("/api/auth")}`);
}
