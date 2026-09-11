const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const users = [
  { name: "Ana Garcia", email: "ana.garcia@example.com" },
  { name: "Carlos Lopez", email: "carlos.lopez@example.com" },
  { name: "Maria Rodriguez", email: "maria.rodriguez@example.com" },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }

  const totalUsers = await prisma.user.count();
  console.log(`Seed completado. Usuarios en la base de datos: ${totalUsers}`);

  // Eliminar seed
  //await prisma.user.deleteMany();
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
