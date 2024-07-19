import { Argon2id } from "oslo/password";

import { prisma } from "~/.server/prisma.js";

export async function createUser(email: string, password: string) {
  const hashedPassword = await new Argon2id().hash(password);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

createUser("me@sarvani.dev", "mysecretloverramana");
