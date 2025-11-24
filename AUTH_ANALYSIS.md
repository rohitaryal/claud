# Authentication Flow Analysis - Registration & Login

## Overview
This document analyzes the authentication system for both registration and login flows across the backend, frontend, and database.

---

## ✅ WORKING - Registration Flow

### Frontend (Signup.tsx)
- ✅ Form validation: username (3+ chars, alphanumeric + hyphens/underscores), email, password (8+ chars), confirm password
- ✅ Calls `apiRegister()` with username, email, password
- ✅ Stores user data in localStorage on success
- ✅ Navigates to `/home` on success

### Backend (routes/auth.ts → services/auth.ts)
- ✅ Validates username (3+ chars), email format, password (8+ chars)
- ✅ Checks for existing user (email or username) in database
- ✅ Hashes password using bcryptjs (salt: 10)
- ✅ Generates UUID for file bucket
- ✅ Creates user record in database with UUID
- ✅ Creates session with 7-day expiration
- ✅ Returns user object and session ID
- ✅ Sets httpOnly, secure session cookie

### Database (db.ts)
- ✅ `users` table exists with proper schema:
  - uuid (PRIMARY KEY)
  - username (UNIQUE)
  - email (UNIQUE)
  - hashed_password
  - file_bucket_id (UNIQUE)
  - timestamps
- ✅ `sessions` table exists:
  - session_id (PRIMARY KEY)
  - user_uuid (FOREIGN KEY → users.uuid)
  - expires_at (timestamp)
  - Indexes on user_uuid
- ✅ `createUser()` function properly inserts user
- ✅ `createSession()` function properly creates session record

### Result: ✅ **Registration will WORK**

---

## ⚠️ ISSUES FOUND - Login Flow

### Issue #1: Cookie Encoding/Decoding Mismatch ❌

**Backend Route (auth.ts - lines 41-42):**
```typescript
const cookie = Buffer.from([result.session, result.user?.username || '', result.user?.uuid || ''].join(':')).toString('base64').split('=').join('')
c.header('Set-Cookie', `session=${cookie}; Path=/; HttpOnly; SameSite=Strict`)
```
- Creates cookie by joining: `session:username:uuid`
- Encodes to base64
- Removes `=` padding

**Cookie Utility (cookie.ts - deocdeCookie):**
```typescript
let splittedCookie = cookieStr.split(":")
if (splittedCookie.length != 3) return null;
splittedCookie = splittedCookie.map(item => atob(item));
```
- **PROBLEM**: Tries to split by `:` BEFORE decoding
- If cookie value is base64 encoded (e.g., `c2VzOHVpbjpqb2huOjEyMy1hYmM`), it won't contain literal `:` characters
- The `split(":")` will return only 1 element, not 3
- Function will return `null`, authentication will fail

**Expected Fix:**
```typescript
export const deocdeCookie = function (cookieStr: string): UserCookie | null {
  try {
    // First decode from base64
    const decoded = atob(cookieStr);
    let splittedCookie = decoded.split(":");
    
    if (splittedCookie.length != 3) {
      return null;
    }
    
    const cookieObj: UserCookie = {
      session: splittedCookie[0],
      username: splittedCookie[1],
      trackingID: splittedCookie[2],
    }
    return cookieObj;
  } catch (err) {
    console.log(err);
    return null;
  }
}
```

---

### Issue #2: Cookie Format Inconsistency ❌

**Registration (auth.ts - lines 21-22):**
```typescript
const cookie = Buffer.from([result.session, username, result.user?.uuid || ''].join(':')).toString('base64').split('=').join('')
```
Format: `session:username:uuid` → base64

**Login (auth.ts - lines 41-42):**
```typescript
const cookie = Buffer.from([result.session, result.user?.username || '', result.user?.uuid || ''].join(':')).toString('base64').split('=').join('')
```
Format: `session:username:uuid` → base64

✅ **These ARE consistent**, but...

**Middleware Expectation (auth.ts):**
```typescript
const parsedCookie = deocdeCookie(cookies);
if (!parsedCookie.trackingID || !parsedCookie.session || !parsedCookie.username) {
  return c.redirect('/login');
}
```
- Expects: `session`, `username`, `trackingID` (where trackingID = uuid)
- Cookie provides: `session`, `username`, `uuid`

✅ **This maps correctly** (uuid → trackingID), BUT won't work due to Issue #1

---

### Issue #3: Missing Logout Endpoint ❌

**Frontend (api.ts - apiLogout function):**
```typescript
export async function apiLogout(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    const data = await response.json()
    if (response.ok) {
      localStorage.removeItem('user')
    }
    return data
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, message: 'Logout failed' }
  }
}
```

**Backend:**
- ❌ **NO logout endpoint exists in routes/auth.ts**
- Will return 404 error when frontend tries to call it
- Session won't be deleted from database

---

### Issue #4: Cookie Not Sent by Frontend ❌

**Frontend (api.ts):**
```typescript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ✅ This sends cookies
  body: JSON.stringify({ email, password })
})
```

✅ Uses `credentials: 'include'` which sends cookies

**However:**
- ✅ Browser WILL receive the `Set-Cookie` header
- ✅ Browser WILL store the session cookie (with HttpOnly flag)
- ✅ Browser WILL send cookie on next request to same origin

**But due to Issue #1**, even though the cookie is sent, the backend can't decode it.

---

### Issue #5: Password Validation Mismatch ⚠️

**Backend (services/auth.ts):**
```typescript
if (!password || password.length < 8) {
  return { success: false, message: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' }
}
```
Minimum: **8 characters**

**Frontend Login (Login.tsx):**
```typescript
if (password.length < 6) {
  newErrors.password = 'Password must be at least 6 characters'
}
```
Minimum: **6 characters**

⚠️ **Inconsistency**: Frontend allows 6-7 char passwords but backend rejects them.
- User creates password with 6 chars: Frontend accepts, backend rejects
- Confusing UX error message

---

## Summary of Issues

### Critical Issues (Must Fix) 🔴
1. **Cookie Encoding/Decoding Mismatch** - Login will fail
2. **Missing Logout Endpoint** - Logout won't work
3. **Password Validation Mismatch** - UX issue with 6-7 char passwords

### Current Status

| Flow | Status | Notes |
|------|--------|-------|
| Registration | ✅ Works | All systems aligned |
| Login | ❌ Fails | Cookie decoding broken |
| Logout | ❌ Fails | Endpoint missing |
| Session Persistence | ❌ Fails | Due to login failure |

---

## Database Status

✅ **Schema is correct:**
- Users table properly configured
- Sessions table with foreign key constraints
- Proper indexes for performance
- Password hashing implemented
- Session expiration support

---

## Recommendations

### Priority 1 (Block Login)
1. Fix `deocdeCookie()` function to decode base64 FIRST, then split
2. Add logout endpoint to `/api/auth/logout`

### Priority 2 (UX/Consistency)
3. Update frontend password validation to require 8 characters minimum

### Priority 3 (Enhancement)
4. Consider adding token-based auth instead of cookie-based for better scalability
5. Add refresh token support for better security

