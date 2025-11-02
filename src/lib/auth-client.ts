// src/lib/auth-client.ts
import { bearer, openAPI, twoFactorClient } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"
import { ac, admin, user, lawyer } from "@/lib/permissions"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    fetchOptions: {
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token") // get the token from the response headers
            // Store the token securely (e.g., in localStorage)
            if(authToken){
              localStorage.setItem("bearer_token", authToken);
            }
        },
        auth: {
           type:"Bearer",
           token: () => localStorage.getItem("bearer_token") || "" // get the token from localStorage
        }
    },
    plugins: [
        twoFactorClient(),
        adminClient({
            ac,
            roles: {
                admin,
                user,
                lawyer
            },
            allowedRoles: ["user", "lawyer"]
        }),
        bearer(),
        openAPI()
    ]
})

export const {
    signIn,
    signOut,
    signUp,
    useSession
} = authClient;