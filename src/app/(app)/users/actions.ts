"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMIN", "BROKER", "CUSTOMER_SERVICE", "ACCOUNTING", "READ_ONLY"]),
});

export async function createUser(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "No tienes permisos para esta acción" };

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un usuario con ese correo" };
    }
    return { error: "No se pudo crear el usuario" };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return;
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/users");
}
