import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { PROTOCOL_VERSION } from "@focuslog/shared";
import { auth } from "../auth/auth";

const AUTH_BASE_PATH = "/api/auth";

export async function setupOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setOpenAPIVersion("3.1.0")
    .setTitle("Focuslog API")
    .setVersion(`protocol ${PROTOCOL_VERSION}`)
    .addCookieAuth("better-auth.session_token")
    .build();
  const appDocument = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  const authDocument = await auth.api.generateOpenAPISchema();
  const document = mergeAuthDocument(appDocument, authDocument);

  SwaggerModule.setup("api/docs", app, document, { jsonDocumentUrl: "api/docs/json" });
}

type AuthOpenApiDocument = Awaited<ReturnType<typeof auth.api.generateOpenAPISchema>>;

// better-auth describes its routes relative to its own server URL; the merged
// document has a single server, so its paths get the base path as a prefix.
function mergeAuthDocument(
  appDocument: OpenAPIObject,
  authDocument: AuthOpenApiDocument,
): OpenAPIObject {
  const authPaths = Object.fromEntries(
    Object.entries(authDocument.paths).map(([path, item]) => [AUTH_BASE_PATH + path, item]),
  ) as OpenAPIObject["paths"];
  const authSchemas = authDocument.components.schemas as NonNullable<
    OpenAPIObject["components"]
  >["schemas"];

  return {
    ...appDocument,
    paths: { ...appDocument.paths, ...authPaths },
    components: {
      ...appDocument.components,
      schemas: { ...authSchemas, ...appDocument.components?.schemas },
    },
    tags: [...(appDocument.tags ?? []), ...authDocument.tags],
  };
}
