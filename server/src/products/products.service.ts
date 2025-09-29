import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

export interface Product {
  id: string;
  name: string;
  price: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly redisService: RedisService) {}

  private products: Product[] = [
    { id: '1', name: 'Product 1', price: 100 },
    { id: '2', name: 'Product 2', price: 200 },
    { id: '3', name: 'Product 3', price: 300 },
  ];

  async findAll(page?: number, limit?: number, fields?: string): Promise<Product[]> {
    // Normaliza parâmetros
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const fieldsKey = (fields || '').trim();

    const cacheKey = `products:all:page=${pageNum}:limit=${limitNum}:fields=${fieldsKey || 'all'}`;
    
    // Tenta buscar do cache primeiro
    const cachedProducts = await this.redisService.get(cacheKey);
    if (cachedProducts) {
      console.log('✅ Cache HIT: Lista de produtos (paginado) encontrada no Redis');
      return cachedProducts;
    }

    // Cache MISS - pagina e seleciona campos
    console.log('❌ Cache MISS: Buscando lista de produtos no banco de dados');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Paginação em memória
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    let pageItems: any[] = this.products.slice(start, end);

    // Seleção de campos
    if (fieldsKey) {
      const requested = new Set(fieldsKey.split(',').map((s) => s.trim()).filter(Boolean));
      pageItems = pageItems.map((p) => {
        const selected: any = {};
        for (const key of requested) {
          if (key in p) selected[key] = (p as any)[key];
        }
        return selected;
      });
    }

    // Salva no cache para próximas consultas (10 min)
    await this.redisService.set(cacheKey, pageItems, 600);
    console.log('💾 Lista de produtos (paginado) salva no Redis');

    return pageItems as Product[];
  }

  async findOne(id: string): Promise<Product | undefined> {
    const cacheKey = `product:${id}`;
    
    // Tenta buscar do cache primeiro
    const cachedProduct = await this.redisService.get(cacheKey);
    if (cachedProduct) {
      console.log(`✅ Cache HIT: Produto ${id} encontrado no Redis`);
      return cachedProduct;
    }

    // Cache MISS - busca dos dados originais
    console.log(`❌ Cache MISS: Buscando produto ${id} no banco de dados`);
    await new Promise(resolve => setTimeout(resolve, 50));

    const product = this.products.find(product => product.id === id);
    
    if (product) {
      // Salva no cache para próximas consultas
      await this.redisService.set(cacheKey, product, 300); // 5 minutos
      console.log(`💾 Produto ${id} salvo no Redis`);
    }

    return product;
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product> {
    const productIndex = this.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    this.products[productIndex] = { 
      ...this.products[productIndex], 
      ...updateData 
    };

    // Invalida caches relacionados
    await this.redisService.del(`product:${id}`);
    await this.redisService.del('products:all');
    console.log(`🗑️ Cache invalidado para produto ${id}`);

    return this.products[productIndex];
  }
}
