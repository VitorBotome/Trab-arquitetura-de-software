import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { RedisService } from '../cache/redis.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, RedisService],
  exports: [ProductsService],
})
export class ProductsModule {}