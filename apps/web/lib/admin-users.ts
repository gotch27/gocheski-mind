export const MIND_ADMIN_EMAIL = "gorazdfilipovski@gmail.com";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  blocked: boolean;
  createdAt: string;
  isAdmin: boolean;
};

export function isMindAdminEmail(email: string) {
  return email.trim().toLowerCase() === MIND_ADMIN_EMAIL;
}
