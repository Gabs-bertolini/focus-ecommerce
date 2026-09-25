import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // app.setGlobalPrefix('api');

  await seedAdminUser(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`[bootstrap] API running on port ${port}`);
}

/**
 * Seed do usuário administrador padrão.
 * TODO: mover para um comando CLI separado (ex: nest-commander)
 * antes de escalar para múltiplas réplicas, evitando race condition
 * e mistura de responsabilidade no startup da aplicação.
 */
async function seedAdminUser(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const usersService = app.get(UsersService);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in production',
      );
    }
    console.warn(
      '[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping admin seed (dev only)',
    );
    return;
  }

  const existingAdmin = await usersService.findByEmail(adminEmail);

  if (!existingAdmin) {
    await usersService.create(adminEmail, adminPassword, true);
    console.log(`[seed] Admin user created: ${adminEmail}`);
  } else if (!existingAdmin.isAdmin) {
    await usersService.setAdminRole(existingAdmin.id, true);
    console.log(`[seed] Admin role restored: ${adminEmail}`);
  } else {
    console.log(`[seed] Admin user already exists: ${adminEmail}`);
  }
}

bootstrap();