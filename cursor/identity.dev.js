// Plain ESM sibling so Turbopack can resolve identity.ts → ./identity.dev.js.
// Keep in sync with identity.dev.ts (the editable typed source).

/** @type {{ sub: string, email: string, name?: string, teamId?: number, teamRole?: "admin" | "member" } | null} */
export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
