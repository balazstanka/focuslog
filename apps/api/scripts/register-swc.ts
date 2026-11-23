import { readFileSync } from "node:fs";
import { registerHooks, type ResolveFnOutput, type ResolveHookContext } from "node:module";
import { fileURLToPath } from "node:url";
import { transformSync } from "@swc/core";

// Nest's dependency injection needs emitDecoratorMetadata, which Node's type
// stripping and esbuild (tsx) do not support. TypeScript 7 has no JS compiler
// API, so @swc-node/register and the Nest CLI cannot be used either.

const TS_EXTENSION_CANDIDATES = [".ts", "/index.ts"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!isLocalSpecifier(specifier) || !isModuleNotFound(error)) {
        throw error;
      }
      return resolveTypeScriptFile(specifier, context, nextResolve) ?? rethrow(error);
    }
  },
  load(url, context, nextLoad) {
    if (!isProjectTypeScriptFile(url)) {
      return nextLoad(url, context);
    }
    const filename = fileURLToPath(url);
    const { code } = transformSync(readFileSync(filename, "utf8"), {
      filename,
      sourceMaps: "inline",
      module: { type: "es6" },
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
      },
    });
    return { format: "module", source: code, shortCircuit: true };
  },
});

function resolveTypeScriptFile(
  specifier: string,
  context: ResolveHookContext,
  nextResolve: (specifier: string, context?: Partial<ResolveHookContext>) => ResolveFnOutput,
) {
  const base = specifier.replace(/\.js$/, "");
  for (const suffix of TS_EXTENSION_CANDIDATES) {
    try {
      return nextResolve(base + suffix, context);
    } catch {
      continue;
    }
  }
  return undefined;
}

function isLocalSpecifier(specifier: string) {
  return specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("file:");
}

function isProjectTypeScriptFile(url: string) {
  return url.startsWith("file:") && url.endsWith(".ts") && !url.includes("/node_modules/");
}

function isModuleNotFound(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ERR_MODULE_NOT_FOUND" || error.code === "ERR_UNSUPPORTED_DIR_IMPORT")
  );
}

function rethrow(error: unknown): never {
  throw error;
}
