import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  });

  // Seed the default administrator without creating duplicates.
  const usersService = app.get(UsersService);
  const adminEmail = 'admin@loja.com';
  const adminPassword = 'admin123';
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();