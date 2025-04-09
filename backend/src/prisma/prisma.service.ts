// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Optional: Connect explicitly on module initialization
    await this.$connect();
  }

  async onModuleDestroy() {
    // Ensure disconnection on module destruction
    await this.$disconnect();
  }

  // Optional: Add custom methods or logic if needed, e.g., for clean shutdowns
  // async enableShutdownHooks(app: INestApplication) { ... }
}