export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string },
  context: { routePath?: string },
) {
  console.error(
    JSON.stringify({
      kind: "onRequestError",
      digest: error.digest ?? null,
      message: error.message,
      path: request.path,
      routePath: context.routePath ?? null,
      stack: error.stack?.split("\n").slice(0, 8) ?? null,
    }),
  );
}
