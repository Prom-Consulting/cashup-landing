// Executed inside the freshly built landing image on the Traefik network.
// No forwarded IP is supplied: this check consumes only the probe's own quota.
const url = process.env.GATEWAY_RATE_LIMIT_URL;
if (!url) throw new Error("GATEWAY_RATE_LIMIT_URL is required");
try {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  if (response.status !== 204 || response.headers.get("x-loal-rate-limit") !== "v1") {
    throw new Error(`Expected the IP guard v1 response (204), received ${response.status}`);
  }
  console.log("Gateway IP protection is ready; frontend deployment can continue");
} catch (cause) {
  throw new Error("Deploy the updated cashup_platform gateway first and check its Redis/network. Running frontend containers were not changed.", { cause });
}
