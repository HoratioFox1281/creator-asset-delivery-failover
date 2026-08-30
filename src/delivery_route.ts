import { createServer, type ServerResponse } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import {
  createInfraiClient,
  deliveryRequestSchema,
  prepareSubscriberUpdate
} from "./creator_delivery";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Buffer | string>): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) {
  throw new Error("Set INFRAI_API_KEY before starting the delivery route");
}

const infrai = createInfraiClient(apiKey);
const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/creator-deliveries") {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const input = deliveryRequestSchema.parse(await readJson(request));
    const update = await prepareSubscriberUpdate(infrai, input);
    sendJson(response, 200, update);
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Invalid delivery request" });
      return;
    }

    if (error instanceof OpenAI.APIError && error.status && error.status < 500) {
      sendJson(response, error.status, { error: error.message });
      return;
    }

    sendJson(response, 502, { error: "Content processing could not be completed" });
  }
}).listen(port, () => {
  console.log(`Creator delivery route listening on http://localhost:${port}`);
});
