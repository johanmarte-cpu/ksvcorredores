import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

/** Fetches the system settings row, creating it with defaults on first use. */
export async function getSettings() {
  return prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export { SETTINGS_ID };
