// Einheitliches API-Fehlerformat (siehe @icp/shared ApiError).
export class ApiErr extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new ApiErr(404, "not_found", `${what} nicht gefunden`);
