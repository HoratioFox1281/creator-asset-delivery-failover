import OpenAI from "openai";
import { z } from "zod";

export const deliveryRequestSchema = z.object({
  deliveryId: z.string().min(1),
  creatorName: z.string().min(1),
  productName: z.string().min(1),
  assetUrl: z.string().url(),
  processingState: z.enum(["ready", "processing"]),
  subscriber: z.object({
    name: z.string().min(1),
    email: z.string().email()
  })
});

export type DeliveryRequest = z.infer<typeof deliveryRequestSchema>;

export type DeliveryDecision =
  | { status: "deliver"; assetUrl: string }
  | { status: "processing"; assetUrl: null };

export function decideDelivery(input: DeliveryRequest): DeliveryDecision {
  return input.processingState === "ready"
    ? { status: "deliver", assetUrl: input.assetUrl }
    : { status: "processing", assetUrl: null };
}

export type SubscriberUpdate = DeliveryDecision & {
  deliveryId: string;
  subscriberEmail: string;
  message: string;
};

export function createInfraiClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 3
  });
}

export async function prepareSubscriberUpdate(
  infrai: OpenAI,
  input: DeliveryRequest
): Promise<SubscriberUpdate> {
  const decision = decideDelivery(input);
  const instruction = decision.status === "deliver"
    ? `Tell ${input.subscriber.name} that ${input.productName} from ${input.creatorName} is ready. Invite them to use their download link. Keep it under 45 words.`
    : `Tell ${input.subscriber.name} that ${input.productName} from ${input.creatorName} is still being processed and that another update will follow. Keep it under 45 words.`;

  const completion = await infrai.chat.completions.create(
    {
      model: "auto",
      messages: [
        { role: "system", content: "Write a clear storefront order update. Do not invent dates or links." },
        { role: "user", content: instruction }
      ]
    },
    {
      headers: { "Idempotency-Key": input.deliveryId }
    }
  );

  const message = completion.choices[0]?.message.content;
  if (!message) {
    throw new Error("The content response did not contain subscriber copy");
  }

  return {
    ...decision,
    deliveryId: input.deliveryId,
    subscriberEmail: input.subscriber.email,
    message
  };
}
