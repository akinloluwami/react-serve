import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      name: "John Doe",
      password: hashedPassword,
      bio: "Software developer and tech enthusiast",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      name: "Jane Smith",
      password: hashedPassword,
      bio: "Full-stack developer and coffee lover",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      password: hashedPassword,
      bio: "Backend engineer and open source contributor",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Demo users:");
  console.log("Email: john@example.com | Password: password123");
  console.log("Email: jane@example.com | Password: password123");
  console.log("Email: alice@example.com | Password: password123");
  console.log("\nCreated users:", { user1, user2, user3 });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
