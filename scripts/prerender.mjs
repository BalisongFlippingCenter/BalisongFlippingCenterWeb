import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer, preview } from "vite";
import puppeteer from "puppeteer-core";

const SITE_URL = "https://www.balisongflippingcenter.com";
const API_URL = `${SITE_URL}/api`;
const DIST_DIR = "dist";
const PRERENDER_DIR = path.join(DIST_DIR, "__prerendered");
const ROUTES_FILE = "prerender-routes.json";
const TRICK_LEVELS = ["beginner", "intermediate", "advanced"];
const CONCURRENCY = 4;
const ATTEMPTS = 2;

const CHROME_PATH =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome");

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  return res.json();
};

const loadLearnTopics = async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    const { LEARN_TOPICS } = await vite.ssrLoadModule("/src/data/learnContent.ts");
    return LEARN_TOPICS;
  } finally {
    await vite.close();
  }
};

const collectRoutes = async () => {
  const [learnTopics, tricks, knives, makers] = await Promise.all([
    loadLearnTopics(),
    readFile("src/data/tricks.json", "utf8").then(JSON.parse),
    fetchJson(`${API_URL}/catalog/any/knives`),
    fetchJson(`${API_URL}/catalog/any/makers`),
  ]);

  return [
    "/",
    "/community",
    "/tutorial-center",
    "/tutorial-center/getting-started",
    ...TRICK_LEVELS.map((level) => `/tutorial-center/${level}`),
    ...tricks.map((trick) => `/tutorial-center/${trick.level}/${trick.slug}`),
    "/product-world",
    ...makers.map((maker) => `/product-world/maker/${maker.slug}`),
    ...knives.map((knife) => `/product-world/knife/${knife.slug}`),
    "/learn",
    ...learnTopics.map((topic) => `/learn/${topic.slug}`),
    "/about",
    "/terms",
    "/privacy",
  ];
};

const renderRoute = async (browser, baseUrl, route) => {
  const page = await browser.newPage();
  try {
    await page.goto(baseUrl + route, { waitUntil: "networkidle0", timeout: 30_000 });
    const noindex = await page.$('meta[name="robots"][content="noindex"]');
    if (noindex) throw new Error("rendered as noindex (missing data or failed API call)");

    // Runtime-injected third-party scripts (e.g. Google sign-in) would load twice once the app boots
    await page.evaluate(() => {
      document.querySelectorAll('script:not([type="module"]), iframe').forEach((el) => el.remove());
    });
    return "<!DOCTYPE html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
  } finally {
    await page.close();
  }
};

const renderWithRetry = async (browser, baseUrl, route) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await renderRoute(browser, baseUrl, route);
    } catch (err) {
      if (attempt >= ATTEMPTS) throw new Error(`${route}: ${err.message}`);
      console.warn(`Retrying ${route}: ${err.message}`);
    }
  }
};

const writePage = async (route, html) => {
  const file = path.join(PRERENDER_DIR, route, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
};

const sitemapXml = (routes) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((route) => `  <url><loc>${SITE_URL}${route === "/" ? "/" : route}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

const routes = await collectRoutes();
console.log(`Prerendering ${routes.length} routes`);

const server = await preview({ preview: { port: 4317, strictPort: true }, logLevel: "silent" });
const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  args: [
    // The production API only allows the real site origins; the local preview origin needs CORS lifted
    "--disable-web-security",
    ...(process.platform === "linux" ? ["--no-sandbox"] : []),
  ],
});

try {
  const queue = [...routes];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let route = queue.shift(); route; route = queue.shift()) {
        await writePage(route, await renderWithRetry(browser, baseUrl, route));
        console.log(`  ${route}`);
      }
    })
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemapXml(routes));
await writeFile(ROUTES_FILE, JSON.stringify(routes, null, 2) + "\n");
console.log(`Wrote ${routes.length} pages, sitemap.xml, and ${ROUTES_FILE}`);
