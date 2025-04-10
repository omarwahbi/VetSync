// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Extending the PrismaClient for use in NestJS
 * This makes the PrismaClient available as a service throughout the application
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    // Connect to the database on module initialization
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect from the database on module destruction
    await this.$disconnect();
  }

  // Method to enable shutdown hooks for graceful shutdowns
  // Can be used in main.ts if needed
  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }
}