export const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  return joinBasePath(appBasePath, path);
}

export function joinBasePath(basePath: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return basePath || "/";
  return `${basePath}${normalizedPath}`;
}
