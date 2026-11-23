import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { setupOpenApi } from "./openapi/setup-openapi";

async function bootstrap() {
  // better-auth needs the raw body; AuthModule re-adds the JSON parser for every other route.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  await setupOpenApi(app);
  await app.listen(env.PORT);
  console.log(`API: http://localhost:${env.PORT}/api, docs: http://localhost:${env.PORT}/api/docs`);
}

await bootstrap();
