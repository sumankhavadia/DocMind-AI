import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const routes = ["signup", "sigup", "login", "dashboard"];
const distDir = path.resolve("dist");
const sourceIndex = path.join(distDir, "index.html");

async function generateRouteFile(route) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");
  await mkdir(routeDir, { recursive: true });
  await copyFile(sourceIndex, routeIndex);
}

async function main() {
  await Promise.all(routes.map(generateRouteFile));
  console.log(`Generated SPA static fallbacks for: ${routes.join(", ")}`);
}

main().catch((error) => {
  console.error("Failed to generate SPA route fallbacks:", error);
  process.exit(1);
});
