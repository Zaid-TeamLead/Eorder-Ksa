import { betterAuth, type BetterAuthOptions } from "better-auth";

export const auth = betterAuth<BetterAuthOptions>({
	database: "", // Invalid configuration
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
});
