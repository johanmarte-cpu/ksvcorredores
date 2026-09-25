import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@corredorpro.local";
  const passwordHash = await bcrypt.hash("Cambiar123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Usuario admin listo: ${admin.email} / Cambiar123! (cámbiala luego de iniciar sesión)`);

  const insurerCount = await prisma.insurer.count();
  if (insurerCount === 0) {
    await prisma.insurer.create({
      data: {
        name: "Aseguradora Demo",
        email: "contacto@aseguradorademo.com",
        products: {
          create: [
            { name: "Auto Cobertura Amplia", lineOfBusiness: "AUTO" },
            { name: "Vida Individual", lineOfBusiness: "LIFE" },
          ],
        },
      },
    });
    console.log("Aseguradora de ejemplo creada.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
