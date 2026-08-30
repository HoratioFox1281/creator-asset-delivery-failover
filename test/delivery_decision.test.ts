import assert from "node:assert/strict";
import test from "node:test";
import { decideDelivery, deliveryRequestSchema } from "../src/creator_delivery";

const order = {
  deliveryId: "order_482_asset_1",
  creatorName: "Northline Studio",
  productName: "Checkout Photo Presets",
  assetUrl: "https://downloads.example.com/orders/order_482/presets.zip",
  subscriber: { name: "Mina", email: "mina@example.com" }
};

test("a ready asset is included in the subscriber delivery", () => {
  const input = deliveryRequestSchema.parse({ ...order, processingState: "ready" });
  assert.deepEqual(decideDelivery(input), {
    status: "deliver",
    assetUrl: order.assetUrl
  });
});

test("a processing asset is withheld until it is ready", () => {
  const input = deliveryRequestSchema.parse({ ...order, processingState: "processing" });
  assert.deepEqual(decideDelivery(input), {
    status: "processing",
    assetUrl: null
  });
});
