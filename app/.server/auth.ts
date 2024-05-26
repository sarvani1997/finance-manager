import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Argon2id } from "oslo/password";
import { parseCookies } from "oslo/cookie";
import { User } from "@prisma/client";
import { LRUCache } from "lru-cache";
import {
  cachified,
  type CacheEntry,
  type Cache,
  totalTtl,
} from "@epic-web/cachified";

import { json, redirect } from "@remix-run/node";

import { prisma } from "./prisma";

const lruInstance = new LRUCache<string, CacheEntry>({ max: 1000 });

const lru: Cache = {
  set(key, value) {
    const ttl = totalTtl(value?.metadata);
    return lruInstance.set(key, value, {
      ttl: ttl === Infinity ? undefined : ttl,
      start: value?.metadata?.createdTime,
    });
  },
  get(key) {
    return lruInstance.get(key);
  },
  delete(key) {
    return lruInstance.delete(key);
  },
};

function validateLuciaSession(sessionId: string) {
  return cachified({
    key: `session-${sessionId}`,
    cache: lru,
    async getFreshValue() {
      /* Normally we want to either use a type-safe API or `checkValue` but
         to keep this example simple we work with `any` */
      return lucia.validateSession(sessionId);
    },
    /* 5 minutes until cache gets invalid
     * Optional, defaults to Infinity */
    ttl: 300_000,
  });
}

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

  const result = await validateLuciaSession(sessionId);

  let cookie = null;
  if (result.session && result.session.fresh) {
    const sessionCookie = lucia.createSessionCookie(result.session.id);
    cookie = sessionCookie.serialize();
  }

  if (!result.session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    cookie = sessionCookie.serialize();

    if (cookie != null) {
      throw redirect("/login", {
        headers: { "Set-Cookie": cookie },
      });
    }
  }

  return { ...result, cookie };
}

export async function assertSignedIn(request: Request) {
  const { session, cookie } = await validateSession(request);
  if (!session) {
    throw redirect("/login");
  }

  if (cookie) {
    throw redirect("/", {
      headers: { "Set-Cookie": cookie },
    });
  }
}
