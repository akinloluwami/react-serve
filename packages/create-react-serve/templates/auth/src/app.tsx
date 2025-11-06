import { App, Route, RouteGroup, Middleware } from "react-serve-js";
import { PORT } from "./config";
import { authMiddleware, loggingMiddleware } from "./middleware";
import {
  SignupHandler,
  LoginHandler,
  GetCurrentUserHandler,
  UpdateProfileHandler,
} from "./routes/auth";
import { GetAllUsersHandler, GetUserByIdHandler } from "./routes/users";

export default function App() {
  return (
    <App port={PORT} cors={true}>
      {/* Health check */}
      <Route path="/" method="GET">
        {async () => {
          return {
            message: "Welcome to ReactServe Auth API",
            version: "1.0.0",
            endpoints: {
              auth: [
                "/auth/signup",
                "/auth/login",
                "/auth/me",
                "/auth/profile",
              ],
              users: ["/users", "/users/:id"],
            },
          };
        }}
      </Route>

      {/* Auth routes */}
      <RouteGroup prefix="/auth">
        <Middleware use={loggingMiddleware} />

        {/* Sign up */}
        <Route path="/signup" method="POST">
          {SignupHandler}
        </Route>

        {/* Login */}
        <Route path="/login" method="POST">
          {LoginHandler}
        </Route>

        {/* Get current user (protected) */}
        <Route path="/me" method="GET" middleware={authMiddleware}>
          {GetCurrentUserHandler}
        </Route>

        {/* Update profile (protected) */}
        <Route path="/profile" method="PUT" middleware={authMiddleware}>
          {UpdateProfileHandler}
        </Route>
      </RouteGroup>

      {/* Public user routes */}
      <RouteGroup prefix="/users">
        <Middleware use={loggingMiddleware} />

        {/* Get all users */}
        <Route path="/" method="GET">
          {GetAllUsersHandler}
        </Route>

        {/* Get user by ID */}
        <Route path="/:id" method="GET">
          {GetUserByIdHandler}
        </Route>
      </RouteGroup>
    </App>
  );
}
