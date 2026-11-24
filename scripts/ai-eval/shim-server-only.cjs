/** Allow Node/tsx eval scripts to import Next.js server-only modules. */
const Module = require("module")
const path = require("path")

try {
  const resolved = require.resolve("server-only")
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
    children: [],
    paths: [],
    parent: null,
    path: path.dirname(resolved),
    isPreloading: false,
    require: Module.createRequire(resolved),
  }
} catch {
  // ignore
}

// Also intercept future resolves of the bare specifier
const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {}
  }
  return originalLoad.apply(this, arguments)
}
