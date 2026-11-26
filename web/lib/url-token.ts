export function readTokenFromHash(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token") ?? "";
}
