import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function requireInstructor() {
  const user = await getSessionUser();
  if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) return null;
  return user;
}
