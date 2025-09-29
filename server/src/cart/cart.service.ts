import { Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class CartService {
  private nextId = 1;

  constructor(private readonly redisService: RedisService) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    console.log('🔄 Criando novo carrinho no Redis...');
    const startTime = Date.now();

    const total = createCartDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const newCart: Cart = {
      id: this.nextId++,
      name: createCartDto.name,
      email: createCartDto.email,
      orderDate: createCartDto.orderDate,
      items: createCartDto.items,
      total,
    };

    // 🔹 Simula latência e salva carrinho no Redis
    await new Promise((resolve) => setTimeout(resolve, 50));
    const cartKey = `cart:${newCart.id}`;
    await this.redisService.set(cartKey, newCart, 0);

    // 🔹 Atualiza lista de IDs
    const cartsListKey = 'carts:list';
    const existingCarts = (await this.redisService.get(cartsListKey)) || [];
    existingCarts.push(newCart.id);
    await this.redisService.set(cartsListKey, existingCarts, 0);

    console.log(
      `✅ Carrinho ${newCart.id} criado e salvo no Redis em ${
        Date.now() - startTime
      }ms`,
    );

    return newCart;
  }

  async findAll(): Promise<Cart[]> {
    console.log('🔄 Buscando todos os carrinhos do Redis...');
    const startTime = Date.now();

    const cartsListKey = 'carts:list';
    const cartIds = (await this.redisService.get(cartsListKey)) || [];

    console.log(`📋 IDs de carrinhos encontrados: ${cartIds.join(', ')}`);

    const carts: Cart[] = [];
    for (const id of cartIds) {
      const cart = await this.redisService.get(`cart:${id}`);
      if (cart) carts.push(cart);
    }

    console.log(
      `✅ ${carts.length} carrinhos recuperados do Redis em ${
        Date.now() - startTime
      }ms`,
    );

    return carts;
  }

  async findOne(id: number): Promise<Cart | undefined> {
    console.log(`🔄 Buscando carrinho ${id} no Redis...`);
    const startTime = Date.now();

    const cartKey = `cart:${id}`;
    const cart = await this.redisService.get(cartKey);

    if (cart) {
      console.log(
        `✅ Carrinho ${id} encontrado no Redis em ${Date.now() - startTime}ms`,
      );
    } else {
      console.log(
        `❌ Carrinho ${id} não encontrado no Redis em ${Date.now() - startTime}ms`,
      );
    }

    return cart;
  }

  async update(id: number, updateCartDto: UpdateCartDto): Promise<Cart | null> {
    console.log(`🔄 Atualizando carrinho ${id} no Redis...`);
    const startTime = Date.now();

    const cartKey = `cart:${id}`;
    const existingCart = await this.redisService.get(cartKey);

    if (!existingCart) {
      console.log(`❌ Carrinho ${id} não encontrado para atualização`);
      return null;
    }

    const updatedCart: Cart = {
      ...existingCart,
      ...updateCartDto,
    };

    if (updateCartDto.items) {
      updatedCart.total = updateCartDto.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    await this.redisService.set(cartKey, updatedCart, 0);

    console.log(
      `✅ Carrinho ${id} atualizado no Redis em ${Date.now() - startTime}ms`,
    );

    return updatedCart;
  }

  async remove(id: number): Promise<Cart | null> {
    console.log(`🔄 Removendo carrinho ${id} do Redis...`);
    const startTime = Date.now();

    const cartKey = `cart:${id}`;
    const cart = await this.redisService.get(cartKey);

    if (!cart) {
      console.log(`❌ Carrinho ${id} não encontrado para remoção`);
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    await this.redisService.del(cartKey);

    const cartsListKey = 'carts:list';
    const cartIds = (await this.redisService.get(cartsListKey)) || [];
    const updatedCartIds = cartIds.filter((cartId) => cartId !== id);
    await this.redisService.set(cartsListKey, updatedCartIds, 0);

    console.log(
      `✅ Carrinho ${id} removido do Redis em ${Date.now() - startTime}ms`,
    );

    return cart;
  }

  async getCacheStats(): Promise<any> {
    const cartsListKey = 'carts:list';
    const cartIds = (await this.redisService.get(cartsListKey)) || [];

    const carts: Cart[] = [];
    for (const id of cartIds) {
      const cart = await this.redisService.get(`cart:${id}`);
      if (cart) carts.push(cart);
    }

    return {
      totalCarts: carts.length,
      cartIds: cartIds,
      memoryUsage: `Redis armazenando ${carts.length} carrinhos`,
      cacheKeys: cartIds.map((id) => `cart:${id}`).concat(['carts:list']),
    };
  }
}
