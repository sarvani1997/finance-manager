import { Argon2id } from "oslo/password";

import { prisma } from "~/services/prisma.server";

export async function createUser(email: string, password: string) {
  const hashedPassword = await new Argon2id().hash(password);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

createUser("me@vramana.com", "mysecretlover");
