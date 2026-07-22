# Authentication Fix TODO

## ✅ Completed

### Priority 1: Fix Login Issues
- [x] Investigate login flow (frontend + backend)
- [x] Verify JWT generation and validation
- [x] Verify CORS configuration
- [x] Verify Spring Security filter chain
- [x] Test login end-to-end

### Priority 2: Implement Forgot / Reset Password
#### Backend
- [x] Add password reset token fields to User.java
- [x] Create ForgotPasswordRequest.java DTO
- [x] Create ResetPasswordRequest.java DTO
- [x] Add forgotPassword() and resetPassword() to AuthService.java
- [x] Add endpoints to AuthController.java
- [x] Add password reset email to EmailService.java
- [x] Add findByPasswordResetToken to UserRepository.java
- [x] Verify endpoints are publicly accessible in SecurityConfig.java (covered by `/api/auth/**`)

#### Frontend
- [x] Create forgot-password/page.tsx
- [x] Create reset-password/page.tsx
- [x] Add API calls to api.ts

### Priority 3: Verify All Auth Routes
- [x] Login
- [x] Register
- [x] Forgot Password
- [x] Reset Password
- [x] Logout
- [x] Refresh Token

### Priority 4: Build, Deploy & Test
- [ ] Build frontend (npm run build)
- [ ] Build backend (mvn package)
- [ ] Deploy to Render
- [ ] Test on https://www.theroyalmukhwas.com
- [ ] Verify complete auth flow

