import { cookies } from "next/headers";
import { hasValidSession, SESSION_COOKIE } from "./auth";
import LoginForm from "./login-form";
import PortalClient from "./portal-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = await hasValidSession(cookieStore.get(SESSION_COOKIE)?.value);

  return authenticated ? <PortalClient /> : <LoginForm />;
}
