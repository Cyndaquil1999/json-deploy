import { serve } from "https://deno.land/std@0.193.0/http/server.ts";

// ディレクトリを指定
const DATA_DIR = "./data";

// ヘルパー関数: ディレクトリ内のファイル一覧を取得
async function getFileList(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".json")) {
      files.push(entry.name.replace(".json", "")); // 拡張子を除外
    }
  }
  return files;
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(path);

  if (path === "/") {
    // トップページ: `/data` へのリンクを表示
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Top Page</title></head>
        <body>
          <h1>Welcome</h1>
          <a href="/data">Go to /data</a>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (path === "/data") {
    // `/data` ページ: ディレクトリ内のファイルリンクを表示
    try {
      const files = await getFileList(DATA_DIR);
      const links = files
        .map((file) => `<li><a href="/data/${file}">${file}</a></li>`)
        .join("");

      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head><title>Data Page</title></head>
          <body>
            <h1>Data Files</h1>
            <ul>
              ${links}
            </ul>
          </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  if (path.startsWith("/data/")) {
    // ファイル名からデータを取得し表示
    const filename = path.replace("/data/", ""); // パスからファイル名を取得
    console.log(filename);
    const filePath = `${DATA_DIR}/${filename}.json`; // ファイル名に拡張子を追加

    try {
      const content = await Deno.readTextFile(filePath);

      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head><title>${filename}</title></head>
          <body>
            <h1>File: ${filename}</h1>
            <pre>${escapeHTML(content)}</pre>
            <a href="/data">Back to /data</a>
          </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
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

// HTMLエスケープを行うヘルパー関数
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
