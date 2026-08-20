export const SESSION_COOKIE = "vra_session";

function configuredValue(name: "VRA_LOGIN_USER" | "VRA_LOGIN_PASSWORD" | "VRA_SESSION_SECRET") {
  return process.env[name] ?? "";
}

export function credentialsMatch(username: string, password: string) {
  const expectedUsername = configuredValue("VRA_LOGIN_USER");
  const expectedPassword = configuredValue("VRA_LOGIN_PASSWORD");
  return Boolean(expectedUsername && expectedPassword && username === expectedUsername && password === expectedPassword);
}

export async function createSessionToken() {
  const payload = [
    configuredValue("VRA_LOGIN_USER"),
    configuredValue("VRA_LOGIN_PASSWORD"),
    configuredValue("VRA_SESSION_SECRET"),
  ].join(":");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hasValidSession(value?: string) {
  if (!value || !configuredValue("VRA_SESSION_SECRET")) return false;
  return value === await createSessionToken();
}
