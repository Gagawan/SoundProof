import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // A05 — en-têtes de sécurité HTTP
  app.use(helmet());

  // A03 — validation stricte de 100 % des entrées : les propriétés non
  // déclarées dans les DTOs sont rejetées (pas seulement ignorées).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS : sans objet pour l'application mobile native (pas d'origine navigateur).
  // Il n'est pas activé ; Swagger UI (dev uniquement) est servi par la même origine.

  // Documentation d'API — jamais exposée en production (A05)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SoundProof API')
      .setDescription(
        'API de réservation de salles de répétition : salles, matériel, réservations, chat.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
