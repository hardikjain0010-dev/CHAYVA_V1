let lastCapturedError: unknown;

function captureError(error: unknown) {
  lastCapturedError = error;
}

const originalConsoleError = console.error.bind(console);

console.error = (...args: unknown[]) => {
  const error = args.find((arg) => arg instanceof Error) ?? args[0];
  if (error !== undefined) {
    captureError(error);
  }

  originalConsoleError(...args);
};

const runtimeProcess = (
  globalThis as {
    process?: {
      on?: (event: "uncaughtException" | "unhandledRejection", handler: (error: unknown) => void) => void;
    };
  }
).process;

if (typeof runtimeProcess?.on === "function") {
  runtimeProcess.on("uncaughtException", captureError);
  runtimeProcess.on("unhandledRejection", captureError);
}

export function consumeLastCapturedError() {
  const error = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
