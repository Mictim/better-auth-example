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
  twoFactor
} from "better-auth/plugins";
import { validator, StandardAdapter } from "validation-better-auth";

export const auth = betterAuth({
  appName: "better_auth_nextjs",
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
        from: "Lawhub <info@lawhub.pl>",
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
        from: "Lawhub <info@lawhub.pl>",
        to: user.email,
        subject: "Email Verification",
        html: `Click the link to verify your email: ${url}`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60 * 24,  
  },
  plugins: [
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          await email.sendMail({
            from: "Lawhub <info@lawhub.pl>",
            to: user.email,
            subject: "Two Factor",
            html: `Your OTP is ${otp}`,
          });
        },
      },
      skipVerificationOnEnable: true,
    }),
    validator([
      { path: "/sign-up/email", adapter: StandardAdapter(SignupSchema) },
      { path: "/sign-in/email", adapter: StandardAdapter(SignInSchema) },
      { path: "/two-factor/enable", adapter: StandardAdapter(PasswordSchema) },
      { path: "/two-factor/disable", adapter: StandardAdapter(PasswordSchema) },
      { path: "/two-factor/verify-otp", adapter: StandardAdapter(twoFactorSchema) },
      { path: "/forgot-password", adapter: StandardAdapter(ForgotPasswordSchema) },
    ])
  ],
});
