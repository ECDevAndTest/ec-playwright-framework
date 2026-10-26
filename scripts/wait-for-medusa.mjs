const baseUrl = process.env.MEDUSA_BASE_URL ?? 'http://localhost:9000';
const healthUrl = new URL('/health', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
const intervalMs = 10_000;
const timeoutMs = Number(process.env.MEDUSA_WAIT_TIMEOUT_MS ?? 180_000);
const deadline = Date.now() + timeoutMs;

console.log(`Waiting for ${healthUrl}`);

while (Date.now() <= deadline) {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 200) {
      console.log(`Medusa is awake (${response.status})`);
      process.exit(0);
    }

    console.log(`Still starting: HTTP ${response.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Still starting: ${message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(`No HTTP 200 from ${healthUrl} within ${timeoutMs}ms`);
process.exit(1);
