// ---------------------------------------------------------------------------
// Print provider abstraction. Swap between Prodigi / Printful / Noop by
// setting PRINT_PROVIDER. Everything falls back to Noop (manual email order)
// when no provider is configured.
// ---------------------------------------------------------------------------

export type PrintOrderInput = {
  photoId: string;
  photoUrl: string;
  sizeId: string;
  paperId: string;
  buyerEmail: string;
  buyerName: string;
  shipping: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  amountCents: number;
  stripeSessionId?: string | null;
};

export interface PrintProvider {
  name: string;
  createOrder(input: PrintOrderInput): Promise<{
    providerOrderId: string | null;
    status: "submitted" | "queued" | "noop";
    message?: string;
  }>;
}

class NoopProvider implements PrintProvider {
  name = "noop";
  async createOrder(input: PrintOrderInput) {
    console.log("[print/noop] would submit order", {
      photoId: input.photoId,
      sizeId: input.sizeId,
      paperId: input.paperId,
      to: input.shipping,
    });
    return {
      providerOrderId: null,
      status: "noop" as const,
      message: "No print provider configured — owner will fulfill manually.",
    };
  }
}

class ProdigiProvider implements PrintProvider {
  name = "prodigi";
  apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async createOrder(input: PrintOrderInput) {
    // TODO: wire real Prodigi API once account is set up.
    // https://www.prodigi.com/print-api/docs/
    console.log("[print/prodigi] TODO: submit order with API key", {
      photoId: input.photoId,
      sizeId: input.sizeId,
    });
    return {
      providerOrderId: null,
      status: "queued" as const,
      message: "Prodigi integration not yet implemented.",
    };
  }
}

class PrintfulProvider implements PrintProvider {
  name = "printful";
  apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async createOrder(input: PrintOrderInput) {
    // TODO: wire real Printful API once account is set up.
    // https://developers.printful.com/docs/
    console.log("[print/printful] TODO: submit order with API key", {
      photoId: input.photoId,
      sizeId: input.sizeId,
    });
    return {
      providerOrderId: null,
      status: "queued" as const,
      message: "Printful integration not yet implemented.",
    };
  }
}

export function getPrintProvider(): PrintProvider {
  const provider = (process.env.PRINT_PROVIDER ?? "none").toLowerCase();
  const apiKey = process.env.PRINT_API_KEY ?? "";
  if (provider === "prodigi" && apiKey) return new ProdigiProvider(apiKey);
  if (provider === "printful" && apiKey) return new PrintfulProvider(apiKey);
  return new NoopProvider();
}

export function isPrintProviderConfigured(): boolean {
  const provider = (process.env.PRINT_PROVIDER ?? "none").toLowerCase();
  const apiKey = process.env.PRINT_API_KEY ?? "";
  return (provider === "prodigi" || provider === "printful") && apiKey.length > 0;
}
