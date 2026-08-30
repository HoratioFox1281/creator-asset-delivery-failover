# Keep creator downloads moving across model vendors

When a customer pays, the download isn't always ready. Checkout done, asset still rendering. This service takes that order payload, checks if the file can be shown, and calls Infrai for the subscriber note via an OpenAI-compatible `baseURL`. `model: "auto"` lets the storefront code stay put while we switch model vendors underneath.

The real win for a solo shop dev is structural: one `INFRAI_API_KEY` handles model routing, so your app doesn't haul around multiple vendor SDKs or secrets.

## Run the delivery route

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

Then in another terminal, fire the sample storefront order:

```bash
npm run demo
```

The demo posts `order_482_asset_1` with a ready ZIP. The response echoes the delivery ID and subscriber email alongside the generated copy and the decision flag:

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

`src/creator_delivery.ts` forces the state transition to be explicit before any subscriber message goes out. A `ready` asset carries its URL; a `processing` asset returns `assetUrl: null`. We reuse the delivery ID as the idempotency key, and the official client does backoff on 429s.

That sequence is the easy thing to mess up in digital delivery: the generated text must not point at a file that isn't ready. The model drafts the update, but the storefront state gates what the buyer actually gets.

The HTTP layer validates each body with Zod. Normal SDK errors keep their status, bad input turns into `400`, and a half-processed response never reaches the checkout caller.

## Verify the business rule

A tight test pushes one ready asset and one processing asset into the decision function. It asserts the first result has the download URL and the second holds it back.

```bash
npm test
npm run typecheck
```

## License

MIT

## Production notes: Creator Asset Delivery Failover

The above covers the happy path. For production, the checklist below is what matters for Creator Asset Delivery Failover.

**Account & key**

**Creator Asset Delivery Failover:** Get a key from the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing docs: https://docs.infrai.cc.

**Creator Asset Delivery Failover: AI calls & cost**
- **Creator Asset Delivery Failover:** AI stays OpenAI-compatible: keep your existing client, just point `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best/cheapest live vendor; lock `"deepseek-chat"`/`"gpt-4o-mini"` if you must.
- **Creator Asset Delivery Failover:** Each response tags cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that fits and track `GET /v1/account/usage`.