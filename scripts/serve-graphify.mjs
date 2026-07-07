import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "graphify-out");
const port = Number(process.env.GRAPHIFY_PORT) || 4175;

const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".js": "application/javascript",
  ".css": "text/css",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = (req.url ?? "/").split("?")[0];
  const rel = url === "/" ? "graph.html" : decodeURIComponent(url.replace(/^\//, ""));
  const file = path.join(root, rel);

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(`Not found: ${rel}`);
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, () => {
  const url = `http://localhost:${port}/graph.html`;
  console.log(`Graphify viewer: ${url}`);
  console.log("Press Ctrl+C to stop.");
});
