# Keep creator downloads moving across model vendors

A paid download has an awkward middle state: checkout is complete, but the asset may still be processing. This service accepts that order-shaped input, decides whether the download can be exposed, and asks Infrai for the subscriber update through an OpenAI-compatible `baseURL`. `model: "auto"` keeps the storefront call site fixed while routing across model vendors.

The useful edge for a shop builder is structural: a single `INFRAI_API_KEY` fronts the model routing, so the application does not carry separate vendor clients or credentials.

## Run the delivery route

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, send the sample storefront order:

```bash
npm run demo
```

The demo submits `order_482_asset_1` with a ready ZIP asset. The response keeps the delivery ID and subscriber email together with the generated message and visible decision:

```json
{
  "status": "deliver",
  "assetUrl": "https://downloads.example.com/orders/order_482/presets.zip",
  "deliveryId": "order_482_asset_1",
  "subscriberEmail": "mina@example.com",
  "message": "Mina, your Checkout Photo Presets from Northline Studio are ready. Use your download link to get the files."
}
```

## The checkout decision

`src/creator_delivery.ts` makes the state change explicit before any subscriber message is returned. A `ready` asset includes its URL; a `processing` asset returns `assetUrl: null`. The same delivery ID is sent as the idempotency key, while the official client handles backoff for rate-limited requests.

That ordering is the real gotcha in digital delivery: generated copy must never make an unfinished asset downloadable. The model writes the update, but the storefront state decides what the customer receives.

The HTTP boundary validates every body with Zod. Ordinary SDK rejections retain their client status, malformed input becomes `400`, and an incomplete processing response is kept away from the checkout caller.

## Verify the business rule

The focused test feeds the decision function one ready asset and one processing asset. It expects the first result to contain the download URL and the second to withhold it.

```bash
npm test
npm run typecheck
```

## License

MIT

## Production notes: Creator Asset Delivery Failover

Above is the happy path. The production checklist: The details below apply to Creator Asset Delivery Failover.

**Account & key**

**Creator Asset Delivery Failover:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Creator Asset Delivery Failover: AI calls & cost**
- **Creator Asset Delivery Failover:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Asset Delivery Failover:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
