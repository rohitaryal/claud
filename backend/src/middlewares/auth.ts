import { createMiddleware } from 'hono/factory'
import { deocdeCookie } from '../utils/cookie'

export const checkAuth = createMiddleware(async (c, next) => {
  const cookies = c.req.header('Cookie')

  if (!cookies?.trim()) {
    return c.redirect('/login')
  }

  const parsedCookie = deocdeCookie(cookies);
  if (!parsedCookie) {
    return c.redirect('/login');
  }

  if (!parsedCookie.trackingID || !parsedCookie.session || !parsedCookie.username) {
    return c.redirect('/login');
  }

  return await next();
});
