import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { RedisService } from '../cache/redis.service';

interface Product {
  id: string;
  name: string;
  price: number;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async findAll() {
    const startTime = Date.now();
    const products = await this.productsService.findAll();
    const endTime = Date.now();

    return {
      products,
      responseTime: `${endTime - startTime}ms`,
      cached: endTime - startTime < 80,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const startTime = Date.now();
    const product = await this.productsService.findOne(id);
    const endTime = Date.now();

    return {
      product,
      responseTime: `${endTime - startTime}ms`,
      cached: endTime - startTime < 80,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    const startTime = Date.now();
    const result = await this.productsService.update(id, updateData);
    const endTime = Date.now();

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      message: 'Produto atualizado com sucesso'
    };
  }

  @Get('debug/redis')
  async getRedisDebug() {
    try {
      const keys = await this.redisService.keys('*');
      const productsKeys = await this.redisService.keys('products:*');
      const productKeys = await this.redisService.keys('product:*');
      
      return {
        allKeys: keys,
        productsKeys: productsKeys,
        productKeys: productKeys,
        totalKeys: keys.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
