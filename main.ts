import { serve } from "https://deno.land/std@0.193.0/http/server.ts";

// ディレクトリを指定
const DATA_DIR = "./data";

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // "/data/" で始まるリクエストに対応
  if (path.startsWith("/data/")) {
    const filename = path.replace("/data/", "");
    const filePath = `${DATA_DIR}/${filename}`;

    try {
      // ファイルの存在確認と読み込み
      const json = await Deno.readTextFile(filePath);
      return new Response(json, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return new Response("File not found", { status: 404 });
      }
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Listening on http://localhost:8000");
