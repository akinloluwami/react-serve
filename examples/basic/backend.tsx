import {
  App,
  Route,
  RouteGroup,
  Middleware,
  Response,
  useRoute,
  useSetContext,
  useContext,
  serve,
  type MiddlewareFunction,
  //@ts-ignore
} from "../../packages/react-serve-js/src";
import logger from "../../packages/react-serve-js/src/logger";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

// Auth middleware example
const authMiddleware: MiddlewareFunction = (req, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return <Response status={401} json={{ error: "Unauthorized" }} />;
  }

  // In a real app, you'd validate the token here
  // For demo purposes, we'll just check if it equals "valid-token"
  if (token !== "valid-token") {
    return <Response status={401} json={{ error: "Invalid token" }} />;
  }

  // Attach user to context so the route can use it
  useSetContext("user", {
    id: 1,
    name: "Titanium",
    email: "admin@example.com",
  });

  return next();
};

// Logging middleware example
const loggingMiddleware: MiddlewareFunction = (req, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Add request timestamp to context
  useSetContext("requestTimestamp", Date.now());

  return next();
};

// Route-specific middleware example
const slowRouteMiddleware: MiddlewareFunction = (req, next) => {
  logger.info(`⏱️ Slow route accessed: ${req.path}`);

  // Simulate some processing time
  useSetContext("processStartTime", Date.now());

  return next();
};

// Another route-specific middleware
const adminLogMiddleware: MiddlewareFunction = (req, next) => {
  logger.info(`🔐 Admin route accessed: ${req.path} at ${new Date().toISOString()}`);

  useSetContext("adminAccess", true);

  return next();
};

export default function Backend() {
  return (
    <App 
      port={6969}
      cors={true} // Enable CORS for all routes
      // Alternatively, you can use custom CORS options:
      // cors={{
      //   origin: 'http://localhost:8080',
      //   methods: ['GET', 'POST'],
      //   credentials: true
      // }}
    >
      <Route path="/" method="GET">
        {async () => {
          return <Response json={{ message: "Welcome to ReactServe!" }} />;
        }}
      </Route>

      {/* Route with individual middleware */}
      <Route path="/slow" method="GET" middleware={slowRouteMiddleware}>
        {async () => {
          const processStart = (useContext("processStartTime") as number) || 0;
          const processingTime = Date.now() - processStart;

          return (
            <Response
              json={{
                message: "This route has its own middleware",
                processStartTime: processStart,
                processingTime: processingTime + "ms",
              }}
            />
          );
        }}
      </Route>

      {/* Route with multiple individual middlewares */}
      <Route
        path="/admin-only"
        method="GET"
        middleware={[loggingMiddleware, adminLogMiddleware]}
      >
        {async () => {
          const timestamp = useContext("requestTimestamp");
          const adminAccess = useContext("adminAccess");

          return (
            <Response
              json={{
                message: "Admin route with multiple middlewares",
                requestedAt: timestamp,
                adminAccess: adminAccess,
              }}
            />
          );
        }}
      </Route>

      {/* Public API routes */}
      <RouteGroup prefix="/api">
        <Middleware use={loggingMiddleware} />

        <Route path="/users" method="GET">
          {async () => {
            const timestamp = useContext("requestTimestamp");
            return (
              <Response
                json={{
                  users: mockUsers,
                  requestedAt: timestamp,
                }}
              />
            );
          }}
        </Route>

        {/* Route with both RouteGroup middleware AND individual middleware */}
        <Route
          path="/special-users"
          method="GET"
          middleware={slowRouteMiddleware}
        >
          {async () => {
            const timestamp = useContext("requestTimestamp");
            const processStart = useContext("processStartTime");

            return (
              <Response
                json={{
                  users: mockUsers.slice(0, 1), // Only first user for "special"
                  requestedAt: timestamp,
                  processStartTime: processStart,
                  note: "This route has RouteGroup middleware + individual middleware",
                }}
              />
            );
          }}
        </Route>

        <Route path="/users/:id" method="GET">
          {async () => {
            const { params } = useRoute();
            const timestamp = useContext("requestTimestamp");
            const user = mockUsers.find((u) => u.id === Number(params.id));
            return user ? (
              <Response json={{ ...user, requestedAt: timestamp }} />
            ) : (
              <Response status={404} json={{ error: "User not found" }} />
            );
          }}
        </Route>

        <Route path="/health" method="GET">
          {async () => {
            const timestamp = useContext("requestTimestamp");
            return (
              <Response
                json={{
                  status: "OK",
                  timestamp: new Date().toISOString(),
                  requestedAt: timestamp,
                }}
              />
            );
          }}
        </Route>
      </RouteGroup>

      {/* Protected API routes */}
      <RouteGroup prefix="/api/protected">
        <Middleware use={loggingMiddleware} />
        <Middleware use={authMiddleware} />

        <Route path="/me" method="GET">
          {async () => {
            const user = useContext("user") as Record<string, any> | null;
            const timestamp = useContext("requestTimestamp");
            return (
              <Response
                json={{
                  ...(user ?? {}),
                  requestedAt: timestamp,
                }}
              />
            );
          }}
        </Route>

        <Route path="/admin/stats" method="GET">
          {async () => {
            const user = useContext("user");
            const timestamp = useContext("requestTimestamp");
            return (
              <Response
                json={{
                  totalUsers: mockUsers.length,
                  adminUser: user,
                  requestedAt: timestamp,
                }}
              />
            );
          }}
        </Route>
      </RouteGroup>
    </App>
  );
}

// Start the server
serve(Backend());
