import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Paneliya Enterprise HRMS API')
    .setDescription('Production-grade modular HRMS REST API with full lifecycle coverage')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Enterprise HRMS Backend is active at http://localhost:${port}/api`);
  console.log(`Swagger OpenAPI documentation at http://localhost:${port}/api/docs`);
}
await bootstrap();
