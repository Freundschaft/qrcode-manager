import { randomUUID } from "crypto";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: process.env.KEYCLOAK_ISSUER
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    jwt({ token }) {
      if (!token.csrf) {
        token.csrf = randomUUID();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      session.csrf = token.csrf as string | undefined;
      return session;
    }
  }
};
