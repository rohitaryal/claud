export interface UserCookie {
  session: string
  username: string
  trackingID: string
}

// deocdeCookie: Accepts a cookie header value and return a proper decoded
// cookie object of type `UserCookie`
export const deocdeCookie = function (cookieStr: string): UserCookie | null {
  // Extract session cookie value from cookie string
  const sessionMatch = cookieStr.match(/session=([^;]+)/);
  if (!sessionMatch) {
    return null;
  }

  const sessionCookie = sessionMatch[1];

  // Decode from base64 first
  let decodedCookie: string;
  try {
    decodedCookie = atob(sessionCookie);
  } catch (err) {
    console.log(err);
    return null;
  }

  // Then split by colon
  const splittedCookie = decodedCookie.split(":");

  if (splittedCookie.length != 3) {
    return null;
  }

  const cookieObj: UserCookie = {
    session: splittedCookie[0],
    username: splittedCookie[1],
    trackingID: splittedCookie[2],
  }

  return cookieObj;
}
