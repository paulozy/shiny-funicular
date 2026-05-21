// In a real client bundle, `server-only`'s default export throws — that's
// what guarantees a server-only module isn't pulled into the browser. Under
// Jest (raw Node, no `react-server` condition), the same throw fires and
// breaks every test that transitively imports a server-only file. Replace
// the module with a no-op so the guarantee still holds at build time while
// tests can run.
export {}
