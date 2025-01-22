import { serve } from "https://deno.land/std@0.193.0/http/server.ts";

// ディレクトリを指定
const DATA_DIR = "./data";

// ヘルパー関数: ディレクトリ内のファイル一覧を取得
async function getFileList(dir: string, extension: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(extension)) {
      files.push(entry.name); // 拡張子を含めたファイル名を保持
    }
  }
  return files;
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(path);

  if (path === "/") {
    // トップページ: テキストファイルのリンクを表示
    try {
      const txtFiles = await getFileList(DATA_DIR, ".txt");

      const txtLinks = txtFiles
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
              ${txtLinks}
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

  // 個別ファイル表示
  const filename = path.replace("/", ""); // パスからファイル名を取得
  const filePath = `${DATA_DIR}/${filename}`;

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
      return new Response("File not found", { status: 404 });
    }
    console.error(error);
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
