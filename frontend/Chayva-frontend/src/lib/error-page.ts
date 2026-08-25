export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Caayva - Server Error</title>
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
      <p>Caayva could not render this page. Please refresh or try again in a moment.</p>
      <a href="/">Return home</a>
    </main>
  </body>
</html>`;
}
