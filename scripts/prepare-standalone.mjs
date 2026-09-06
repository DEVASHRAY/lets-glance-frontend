// Node runs this ESM file after `next build` because standalone output omits browser assets by design.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneRoot = join(".next", "standalone");

mkdirSync(join(standaloneRoot, ".next"), { recursive: true });
cpSync(join(".next", "static"), join(standaloneRoot, ".next", "static"), {
  recursive: true,
});

if (existsSync("public")) {
  cpSync("public", join(standaloneRoot, "public"), { recursive: true });
}
