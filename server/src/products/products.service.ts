import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity'; 

@Injectable()
export class ProductsService {
  private products: Product[] = [
    { id: 1, name: 'Camisa', price: 50, stock: 10 },
    { id: 2, name: 'Calça', price: 100, stock: 5 },
    { id: 3, name: 'Tênis', price: 200, stock: 8 },
    { id: 4, name: 'Jaqueta', price: 280, stock: 3},
    { id: 5, name: 'Meia', price: 20, stock: 15}
  ];

  findAll(page: number = 1, limit: number = 10): Product[] {
    const start = (page - 1) * limit;
    return this.products.slice(start, start + limit);
  }

  findOne(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}
