import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Argon2id } from "oslo/password";
import { parseCookies } from "oslo/cookie";
import { prisma } from "./prisma.server";
import { User } from "@prisma/client";
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<User, "id">;
  }
}

export async function validateLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const validPassword = await new Argon2id().verify(user.password, password);

  if (!validPassword) {
    return json({
      error: "Incorrect username or password",
    });
  }

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}

export async function validateSession(request: Request) {
  const sessionId = parseCookies(request.headers.get("Cookie") || "").get(
    lucia.sessionCookieName
  );

  if (!sessionId) {
    return { session: null, user: null, cookie: null };
  }

  const result = await lucia.validateSession(sessionId);

  let cookie = null;
  if (result.session && result.session.fresh) {
    const sessionCookie = lucia.createSessionCookie(result.session.id);
    cookie = sessionCookie.serialize();
  }

  if (!result.session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    cookie = sessionCookie.serialize();
  }

  return { ...result, cookie };
}

export const loginAction = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();

  return validateLogin(
    body.get("email") as string,
    body.get("password") as string
  );
};
