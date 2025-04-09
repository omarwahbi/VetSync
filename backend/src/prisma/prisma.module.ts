// backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Make PrismaService available globally without importing PrismaModule everywhere
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}