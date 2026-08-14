//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
function captureError(error) {
	lastCapturedError = error;
}
var originalConsoleError = console.error.bind(console);
console.error = (...args) => {
	const error = args.find((arg) => arg instanceof Error) ?? args[0];
	if (error !== void 0) captureError(error);
	originalConsoleError(...args);
};
var runtimeProcess = globalThis.process;
if (typeof runtimeProcess?.on === "function") {
	runtimeProcess.on("uncaughtException", captureError);
	runtimeProcess.on("unhandledRejection", captureError);
}
function consumeLastCapturedError() {
	const error = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chayva - Server Error</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top left, rgba(168, 85, 247, 0.22), transparent 34rem),
          radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.18), transparent 30rem),
          #101018;
        color: #f8fafc;
      }

      main {
        width: min(92vw, 30rem);
        padding: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(18px);
      }

      h1 {
        margin: 0;
        font-size: clamp(1.6rem, 4vw, 2.35rem);
        line-height: 1.1;
      }

      p {
        margin: 1rem 0 0;
        color: rgba(248, 250, 252, 0.72);
        line-height: 1.6;
      }

      a {
        display: inline-flex;
        margin-top: 1.5rem;
        color: inherit;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Something went wrong.</h1>
      <p>Chayva could not render this page. Please refresh or try again in a moment.</p>
      <a href="/">Return home</a>
    </main>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-CHQ18vO4.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
