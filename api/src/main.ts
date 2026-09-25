import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: process.env.FRONTEND_URL,
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

  await app.listen(3001, '0.0.0.0');
}
bootstrap();