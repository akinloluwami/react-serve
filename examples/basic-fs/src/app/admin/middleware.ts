import { Response, type MiddlewareFunction, useSetContext } from "react-serve-js";

const requireAuth: MiddlewareFunction = (req, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token || token !== "valid-token") {
    return Response({ status: 401, json: { error: "Unauthorized" } });
  }
  useSetContext("user", { id: 1, role: "admin", name: "Admin" });
  return next();
};

export default requireAuth;

 
