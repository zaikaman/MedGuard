import "dotenv/config";
import { z } from "zod";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  T3N_API_KEY: z.string().min(1),
  T3_DID: z.string().regex(/^did:t3n:[a-fA-F0-9]{40}$/, "Expected a Terminal 3 DID like did:t3n:<40 hex chars>"),
  T3N_ENVIRONMENT: z
    .enum(["testnet", "production", "mainnet"])
    .default("testnet")
    .transform((value) => (value === "mainnet" ? "production" : value)),
  T3N_NODE_URL: optionalUrl,
  T3N_AGENT_REGISTRATION_CONTRACT: z.string().min(1),
  T3N_AGENT_REGISTRATION_FUNCTION: z.string().min(1).default("register-agent"),
  T3N_PRESENTATION_CONTRACT: z.string().min(1),
  T3N_PRESENTATION_FUNCTION: z.string().min(1).default("generate-presentation"),
  T3N_VERIFICATION_CONTRACT: z.string().min(1),
  T3N_VERIFICATION_FUNCTION: z.string().min(1).default("verify-presentation"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}

export const env = loadEnv();
