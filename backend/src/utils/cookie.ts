export interface UserCookie {
  session: string
  username: string
  trackingID: string
}

// deocdeCookie: Accepts a cookie header value and return a proper decoded
// cookie object of type `UserCookie`
export const deocdeCookie = function (cookieStr: string): UserCookie | null {
  let splittedCookie = cookieStr.split(":");

  if (splittedCookie.length != 3) {
    return null;
  }

  try {
    splittedCookie = splittedCookie.map(item => atob(item));
  } catch (err) {
    console.log(err);
    return null;
  }


  const cookieObj: UserCookie = {
    session: splittedCookie[0],
    username: splittedCookie[1],
    trackingID: splittedCookie[2],
  }

  return cookieObj;
}
