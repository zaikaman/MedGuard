import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
  setNodeUrl,
  type Environment,
} from "@terminal3/t3n-sdk";
import { z } from "zod";
import { env } from "../../config/env.js";
import type { Role } from "../../types/domain.js";

export interface RegisterAgentInput {
  profileId: string;
  role: Role;
}

export interface GeneratePresentationInput {
  patientDid: string;
  recipientDid: string;
  credentialReference: string;
  requestedClaimType: string;
  purpose: string;
}

export interface VerifyPresentationInput {
  presentationReference: string;
  expectedRecipientDid: string;
}

export interface Terminal3Client {
  registerAgent(input: RegisterAgentInput): Promise<{ did: string; tenantId: string }>;
  generatePresentation(input: GeneratePresentationInput): Promise<{ presentationHash: string; t3Reference: string }>;
  verifyPresentation(input: VerifyPresentationInput): Promise<{ accepted: boolean; reason?: string }>;
}

const registerAgentResponseSchema = z.object({
  did: z.string().min(1),
  tenantId: z.string().min(1),
});

const presentationResponseSchema = z.object({
  presentationHash: z.string().min(1),
  t3Reference: z.string().min(1),
});

const verificationResponseSchema = z.object({
  accepted: z.boolean(),
  reason: z.string().min(1).optional(),
});

type AuthenticatedT3nSession = {
  client: T3nClient;
  tenant: TenantClient;
  nodeUrl: string;
};

export class Terminal3SdkClient implements Terminal3Client {
  private sessionPromise: Promise<AuthenticatedT3nSession> | null = null;

  async registerAgent(input: RegisterAgentInput): Promise<{ did: string; tenantId: string }> {
    return this.executeContract({
      contract: env.T3N_AGENT_REGISTRATION_CONTRACT,
      functionName: env.T3N_AGENT_REGISTRATION_FUNCTION,
      input,
      schema: registerAgentResponseSchema,
    });
  }

  async generatePresentation(input: GeneratePresentationInput): Promise<{ presentationHash: string; t3Reference: string }> {
    return this.executeContract({
      contract: env.T3N_PRESENTATION_CONTRACT,
      functionName: env.T3N_PRESENTATION_FUNCTION,
      input,
      schema: presentationResponseSchema,
    });
  }

  async verifyPresentation(input: VerifyPresentationInput): Promise<{ accepted: boolean; reason?: string }> {
    return this.executeContract({
      contract: env.T3N_VERIFICATION_CONTRACT,
      functionName: env.T3N_VERIFICATION_FUNCTION,
      input,
      schema: verificationResponseSchema,
    });
  }

  private async executeContract<T>(options: {
    contract: string;
    functionName: string;
    input: object;
    schema: z.ZodType<T>;
  }): Promise<T> {
    const session = await this.getAuthenticatedSession();

    return session.tenant.executeBusinessContract(session.client, {
      tenant: env.T3_DID,
      contract: options.contract,
      functionName: options.functionName,
      input: options.input as Record<string, unknown>,
      schema: options.schema,
    });
  }

  private async getAuthenticatedSession(): Promise<AuthenticatedT3nSession> {
    this.sessionPromise ??= this.createAuthenticatedSession();

    try {
      return await this.sessionPromise;
    } catch (error) {
      this.sessionPromise = null;
      throw error;
    }
  }

  private async createAuthenticatedSession(): Promise<AuthenticatedT3nSession> {
    const environment = env.T3N_ENVIRONMENT as Environment;
    setEnvironment(environment);

    if (env.T3N_NODE_URL) {
      setNodeUrl(env.T3N_NODE_URL);
    }

    const nodeUrl = getNodeUrl(env.T3N_NODE_URL);
    const privateKey = env.T3N_API_KEY;
    const address = eth_get_address(privateKey);
    const client = new T3nClient({
      baseUrl: nodeUrl,
      wasmComponent: await loadWasmComponent(),
      handlers: {
        EthSign: metamask_sign(address, undefined, privateKey),
      },
    });

    await client.handshake();
    const authenticatedDid = await client.authenticate(createEthAuthInput(address));
    const authenticatedDidValue = authenticatedDid.toString();

    if (authenticatedDidValue !== env.T3_DID) {
      throw new Error(`Terminal 3 authentication returned ${authenticatedDidValue}, expected ${env.T3_DID}`);
    }

    return {
      client,
      tenant: new TenantClient({
        environment,
        endpoint: nodeUrl,
        baseUrl: nodeUrl,
        tenantDid: env.T3_DID,
        t3n: client,
      }),
      nodeUrl,
    };
  }
}

export const terminal3Client = new Terminal3SdkClient();
