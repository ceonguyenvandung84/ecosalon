import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // D1 binding "DB" is wired automatically from wrangler.toml / CF dashboard.
});
