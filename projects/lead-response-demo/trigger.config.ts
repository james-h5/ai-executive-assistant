import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Reusing the existing trigger.dev project (same one ai-lead-generator uses).
  // If task ids ever collide across the two local projects, switch this to a new
  // project id from cloud.trigger.dev instead — no new account/signup needed either way.
  project: "proj_omtdpuzktsfskxspmnos",
  dirs: ["./src/trigger"],
  maxDuration: 300,
});
