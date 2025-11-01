// auth.ts
import prisma from "@/db";
import { email } from "@/helpers/email/resend";
import { ForgotPasswordSchema } from "@/helpers/zod/forgot-password-schema";
import SignInSchema from "@/helpers/zod/login-schema";
import { PasswordSchema, SignupSchema } from "@/helpers/zod/signup-schema";
import { twoFactorSchema } from "@/helpers/zod/two-factor-schema";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin as adminPlugin,
  openAPI,
  twoFactor
} from "better-auth/plugins";
import { validator } from "validation-better-auth";
import { ac, admin, lawyer, user } from "@/lib/permissions"
import { roleSignupPlugin } from "@/lib/role-signup-plugin";

export const auth = betterAuth({
  appName: "better_auth_nextjs",
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "",
  ],
  advanced: {
    disableCSRFCheck: false,
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await email.sendMail({
        from: "Lawhub <test@lawhub.pl>",
        to: user.email,
        subject: "Reset your password",
        html: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await email.sendMail({
        from: "Lawhub <test@lawhub.pl>",
        to: user.email,
        subject: "Email Verification",
        html: `Click the link to verify your email: ${url}`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 12,
    freshAge: 60 * 60 * 1,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  plugins: [
    roleSignupPlugin(), // Add this BEFORE admin plugin to intercept requests
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          await email.sendMail({
            from: "Lawhub <test@lawhub.pl>",
            to: user.email,
            subject: "Two Factor",
            html: `Your OTP is ${otp}`,
          });
        },
      },
      skipVerificationOnEnable: true,
    }),
    validator([
      // { path: "/sign-up/email", adapter: YupAdapter(SignupSchema) },
      // { path: "/sign-in/email", adapter: YupAdapter(SignInSchema) },
      // { path: "/two-factor/enable", adapter: YupAdapter(PasswordSchema) },
      // { path: "/two-factor/disable", adapter: YupAdapter(PasswordSchema) },
      // { path: "/two-factor/verify-otp", adapter: YupAdapter(twoFactorSchema) },
      // { path: "/forgot-password", adapter: YupAdapter(ForgotPasswordSchema) },
      { path: "/sign-up/email", schema: SignupSchema },
      { path: "/sign-in/email", schema: SignInSchema },
      { path: "/two-factor/enable", schema: PasswordSchema },
      { path: "/two-factor/disable", schema: PasswordSchema },
      { path: "/two-factor/verify-otp", schema: twoFactorSchema },
      { path: "/forgot-password", schema: ForgotPasswordSchema },
    ]),
    adminPlugin({
      defaultRole: "user",
      impersonationSessionDuration: 60 * 60 * 24,
      defaultBanReason: "Spamming",
      ac,
      roles: {
        admin,
        user,
        lawyer
      }
    }),
    openAPI()
  ],
});
