import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("https://api.bharathdelightfoods.com"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://bharathdelightfoods.com"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_GOOGLE_SC_TOKEN: z.string().optional(),
  NEXT_PUBLIC_BING_WMT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MEDIA_BASE_URL: z.string().optional(),
});

const getEnvData = () => {
  return {
    NEXT_PUBLIC_API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD && typeof window !== "undefined" ? window.location.origin : "https://api.bharathdelightfoods.com"),
    NEXT_PUBLIC_APP_URL: import.meta.env.VITE_APP_URL || "https://bharathdelightfoods.com",
    NODE_ENV: import.meta.env.MODE || "development",
    NEXT_PUBLIC_GOOGLE_SC_TOKEN: import.meta.env.VITE_GOOGLE_SC_TOKEN,
    NEXT_PUBLIC_BING_WMT_TOKEN: import.meta.env.VITE_BING_WMT_TOKEN,
    NEXT_PUBLIC_MEDIA_BASE_URL: import.meta.env.VITE_MEDIA_BASE_URL,
  };
};

const parseEnv = () => {
  const envData = getEnvData();
  const result = envSchema.safeParse(envData);

  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:", result.error.format());
    if (import.meta.env.MODE === "production") {
      throw new Error("Missing or invalid crucial environment variables. Build aborted.");
    }
    // Return safe default fallbacks for local development compiling
    return {
      NEXT_PUBLIC_API_URL: "https://api.bharathdelightfoods.com",
      NEXT_PUBLIC_APP_URL: "https://bharathdelightfoods.com",
      NODE_ENV: "development" as const,
      NEXT_PUBLIC_GOOGLE_SC_TOKEN: undefined,
      NEXT_PUBLIC_BING_WMT_TOKEN: undefined,
      NEXT_PUBLIC_MEDIA_BASE_URL: undefined,
    };
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
