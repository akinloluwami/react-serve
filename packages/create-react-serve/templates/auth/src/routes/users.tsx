import { Response, useRoute } from "react-serve-js";
import { prisma } from "../config";

// Get all users handler
export async function GetAllUsersHandler() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return (
      <Response
        status={200}
        json={{
          users,
          count: users.length,
        }}
      />
    );
  } catch (error) {
    console.error("Get all users error:", error);
    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}

// Get user by ID handler
export async function GetUserByIdHandler() {
  try {
    const { params } = useRoute();
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return <Response status={404} json={{ error: "User not found" }} />;
    }

    return <Response status={200} json={{ user }} />;
  } catch (error) {
    console.error("Get user by ID error:", error);
    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}
