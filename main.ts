import { serve } from "https://deno.land/std@0.193.0/http/server.ts";

// ディレクトリを指定
const DATA_DIR = ".";

// ヘルパー関数: ディレクトリ内のファイル一覧を取得
async function getFileList(dir: string, extensions: string[]): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(entry.name); // 拡張子を含めたファイル名を保持
      }
    }
    return files;
  } catch (error) {
    console.error("Error reading directory:", error.message);
    throw error;
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log("Request Path:", path);

  if (path === "/") {
    // トップページ: ファイルのリンクを表示
    try {
      const files = await getFileList(DATA_DIR, [".txt", ".json"]);

      const fileLinks = files
        .map((file) => `<li><a href="/${file}">${file}</a></li>`)
        .join("");

      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head><title>Top Page</title></head>
          <body>
            <h1>Welcome</h1>
            <ul>
              ${fileLinks}
            </ul>
          </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    } catch (error) {
      console.error("Error generating top page:", error.message);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 個別ファイル表示
  const filename = path.replace("/", ""); // パスからファイル名を取得
  const filePath = `${DATA_DIR}/${filename}`;

  try {
    const content = await Deno.readTextFile(filePath);
    const isJSON = filename.endsWith(".json");
    const parsedContent = isJSON
      ? `<pre>${escapeHTML(JSON.stringify(JSON.parse(content), null, 2))}</pre>`
      : `<pre>${escapeHTML(content)}</pre>`;

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>${filename}</title></head>
        <body>
          <h1>File: ${filename}</h1>
          ${parsedContent}
          <a href="/">Back to Top Page</a>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error("File not found:", filename);
      return new Response("File not found", { status: 404 });
    }
    console.error("Error reading file:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
});

// HTMLエスケープを行うヘルパー関数
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

console.log("Listening on http://localhost:8000");
