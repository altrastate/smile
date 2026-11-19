export type AppError = {
  code: string;
  message: string;
};

export function toAppError(error: unknown, fallback = "Something went wrong."): AppError {
  if (error instanceof Error && error.message) {
    return { code: error.name || "error", message: error.message };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) {
      return { code: "error", message };
    }
  }

  return { code: "unknown", message: fallback };
}
