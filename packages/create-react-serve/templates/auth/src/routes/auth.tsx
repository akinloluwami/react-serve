import { Response, useRoute, useContext } from "react-serve-js";
import { prisma } from "../config";
import { signupSchema, loginSchema, updateProfileSchema } from "../schemas";
import { generateToken, hashPassword, comparePassword } from "../auth";

// Sign up handler
export async function SignupHandler() {
  try {
    const { body } = useRoute();

    // Validate request body
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return (
        <Response
          status={400}
          json={{ error: "User with this email already exists" }}
        />
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        bio: validatedData.bio,
        avatar: validatedData.avatar,
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    return (
      <Response
        status={201}
        json={{
          message: "User created successfully",
          user,
          token,
        }}
      />
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.name === "ZodError") {
      return (
        <Response
          status={400}
          json={{ error: "Validation error", details: error.errors }}
        />
      );
    }

    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}

// Login handler
export async function LoginHandler() {
  try {
    const { body } = useRoute();

    // Validate request body
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return (
        <Response status={401} json={{ error: "Invalid email or password" }} />
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password,
    );

    if (!isPasswordValid) {
      return (
        <Response status={401} json={{ error: "Invalid email or password" }} />
      );
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return (
      <Response
        status={200}
        json={{
          message: "Login successful",
          user: userWithoutPassword,
          token,
        }}
      />
    );
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.name === "ZodError") {
      return (
        <Response
          status={400}
          json={{ error: "Validation error", details: error.errors }}
        />
      );
    }

    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}

// Get current user handler (protected route)
export async function GetCurrentUserHandler() {
  try {
    const user = useContext("user");

    return <Response status={200} json={{ user }} />;
  } catch (error) {
    console.error("Get current user error:", error);
    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}

// Update profile handler (protected route)
export async function UpdateProfileHandler() {
  try {
    const { body } = useRoute();
    const user = useContext("user");

    // Validate request body
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return (
      <Response
        status={200}
        json={{
          message: "Profile updated successfully",
          user: updatedUser,
        }}
      />
    );
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.name === "ZodError") {
      return (
        <Response
          status={400}
          json={{ error: "Validation error", details: error.errors }}
        />
      );
    }

    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
}
