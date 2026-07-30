# Forgot password + register hardening

Date: 2026-07-30  
Status: approved (approach A)

## Goal
- Add Firebase email password-reset from the login card.
- Harden register validation without changing Auth provider.

## UX
- Auth modes: `login` | `register` | `forgot`.
- Login shows link “Quên mật khẩu?” → `forgot`.
- Forgot: email only, CTA “Gửi link đặt lại”, link “Quay lại đăng nhập”.
- Success copy (neutral): “Nếu email tồn tại trong hệ thống, bạn sẽ nhận link đặt lại mật khẩu.”
- Register: confirm password field; trim email; client min length 6; passwords must match.

## Service
- `resetPassword(email)` → `sendPasswordResetEmail(auth, normalizedEmail)`.
- `signIn` / `signUp` trim + lowercase email before Firebase / Firestore.

## Out of scope
- Custom reset landing page (Firebase hosted action URL).
- Username uniqueness enforcement.
- Changing Firebase Console templates (ops note only).
