export {};

const response = await fetch("http://localhost:3000/creator-deliveries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliveryId: "order_482_asset_1",
    creatorName: "Northline Studio",
    productName: "Checkout Photo Presets",
    assetUrl: "https://downloads.example.com/orders/order_482/presets.zip",
    processingState: "ready",
    subscriber: {
      name: "Mina",
      email: "mina@example.com"
    }
  })
});

const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
