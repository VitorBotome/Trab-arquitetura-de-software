// src/products/products.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Product[] {
    return this.productsService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  getById(@Param('id') id: string): Product | { message: string } {
    const product = this.productsService.findOne(+id);
    if (!product) {
      return { message: 'Produto não encontrado' };
    }
    return product;
  }
}

