import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { RedisService } from '../cache/redis.service';

@Module({
  controllers: [CartController],
  providers: [CartService, RedisService],
  exports: [CartService],
})
export class CartModule {}
