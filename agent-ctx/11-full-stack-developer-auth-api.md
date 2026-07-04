# Task 11 - Auth API Agent Work Record

## Files Created (15 total)

### Shared Library
- `/src/lib/auth.ts` — JWT (jose), bcrypt, 2FA (otplib v13), email domain validation

### Auth API Routes (11 files)
- `/src/app/api/auth/login/route.ts` — POST login with 2FA temp token support
- `/src/app/api/auth/verify-2fa/route.ts` — POST 2FA code verification
- `/src/app/api/auth/setup-2fa/route.ts` — POST generate QR code (auth required)
- `/src/app/api/auth/enable-2fa/route.ts` — POST enable 2FA after verification
- `/src/app/api/auth/disable-2fa/route.ts` — POST disable 2FA (requires password)
- `/src/app/api/auth/forgot-password/route.ts` — POST send reset link
- `/src/app/api/auth/reset-password/route.ts` — POST reset password with token
- `/src/app/api/auth/session/route.ts` — GET current session
- `/src/app/api/auth/logout/route.ts` — POST clear cookie
- `/src/app/api/auth/change-password/route.ts` — POST change password (auth required)
- `/src/app/api/auth/seed/route.ts` — POST seed admin (idempotent)

### User Management (2 files)
- `/src/app/api/users/route.ts` — GET list + POST create (admin only)
- `/src/app/api/users/[id]/route.ts` — GET/PUT/DELETE single user (admin only)

### Email Logs (1 file)
- `/src/app/api/email-logs/route.ts` — GET email logs (admin only, limit 50)

## Key Decisions
- Used otplib v13 API (`generateSecret`, `generateURI`, `verifySync`) instead of deprecated `authenticator` class
- `verifySync` returns `{ valid: boolean }` object, extracted `.valid` for boolean return
- `signToken` accepts custom expiration parameter for 2FA temp tokens (5 min)
- All auth routes use Indonesian error messages
- Password never returned in user serialization
- Cookie name: `pmo_token` with HttpOnly, Secure (production), SameSite=Lax

## Test Results
- Seed: ✅ Creates admin, idempotent on re-run
- Login: ✅ Returns JWT + sets cookie
- Session: ✅ Returns null (no auth) / user data (with cookie)
- Users list: ✅ Returns admin user with proper fields
- Lint: ✅ Zero errors