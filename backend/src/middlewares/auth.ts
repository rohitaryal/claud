import { createMiddleware } from "hono/factory";

const checkAuth = createMiddleware(async (c, next) => {
  const cookies = c.req.header("Cookie");

  if (!cookies?.trim()) {
    return c.redirect("/login");
  }
});
