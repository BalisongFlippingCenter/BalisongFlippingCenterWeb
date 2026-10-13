import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const KVS_ARN = process.env.PRERENDER_KVS_ARN;
const ROUTES_FILE = "prerender-routes.json";
const MAX_KEYS_PER_UPDATE = 50;

if (!KVS_ARN) throw new Error("PRERENDER_KVS_ARN is not set");

const kvs = (command, ...args) =>
  JSON.parse(
    execFileSync("aws", ["cloudfront-keyvaluestore", command, "--kvs-arn", KVS_ARN, ...args, "--output", "json"], {
      encoding: "utf8",
    })
  );

const listKeys = () => {
  const keys = new Set();
  let nextToken;
  do {
    const page = kvs("list-keys", ...(nextToken ? ["--next-token", nextToken] : []));
    page.Items.forEach((item) => keys.add(item.Key));
    nextToken = page.NextToken;
  } while (nextToken);
  return keys;
};

const routes = new Set(JSON.parse(readFileSync(ROUTES_FILE, "utf8")));
const existing = listKeys();
const changes = [
  ...[...routes].filter((route) => !existing.has(route)).map((Key) => ({ put: { Key, Value: "1" } })),
  ...[...existing].filter((key) => !routes.has(key)).map((Key) => ({ delete: { Key } })),
];

let etag = kvs("describe-key-value-store").ETag;
for (let i = 0; i < changes.length; i += MAX_KEYS_PER_UPDATE) {
  const batch = changes.slice(i, i + MAX_KEYS_PER_UPDATE);
  const puts = batch.filter((c) => c.put).map((c) => c.put);
  const deletes = batch.filter((c) => c.delete).map((c) => c.delete);
  etag = kvs(
    "update-keys",
    "--if-match", etag,
    ...(puts.length ? ["--puts", JSON.stringify(puts)] : []),
    ...(deletes.length ? ["--deletes", JSON.stringify(deletes)] : []),
  ).ETag;
}

const added = changes.filter((c) => c.put).length;
console.log(`Prerendered routes in KVS: ${routes.size} (${added} added, ${changes.length - added} removed)`);
