import { Response } from "../../../../../packages/react-serve-js/src";

export default async function HealthHandler() {
  return (
    <Response
      json={{
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      }}
    />
  );
}
