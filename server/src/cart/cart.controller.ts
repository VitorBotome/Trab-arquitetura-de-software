import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(@Body() createCartDto: CreateCartDto) {
    const startTime = Date.now();
    const result = await this.cartService.create(createCartDto);
    const endTime = Date.now();

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      message: 'Carrinho criado com sucesso no Redis',
      storedIn: 'Redis Cloud'
    };
  }

  @Get()
  async findAll() {
    const startTime = Date.now();
    const result = await this.cartService.findAll();
    const endTime = Date.now();

    return {
      carts: result,
      responseTime: `${endTime - startTime}ms`,
      count: result.length,
      storedIn: 'Redis Cloud',
      message: `Recuperados ${result.length} carrinhos do Redis`
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const startTime = Date.now();
    const result = await this.cartService.findOne(+id);
    const endTime = Date.now();

    if (!result) {
      return {
        message: 'Carrinho não encontrado no Redis',
        responseTime: `${endTime - startTime}ms`
      };
    }

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      storedIn: 'Redis Cloud',
      message: 'Carrinho recuperado do Redis'
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    const startTime = Date.now();
    const result = await this.cartService.update(+id, updateCartDto);
    const endTime = Date.now();

    if (!result) {
      return {
        message: 'Carrinho não encontrado no Redis',
        responseTime: `${endTime - startTime}ms`
      };
    }

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      message: 'Carrinho atualizado no Redis',
      storedIn: 'Redis Cloud'
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const startTime = Date.now();
    const result = await this.cartService.remove(+id);
    const endTime = Date.now();

    if (!result) {
      return {
        message: 'Carrinho não encontrado no Redis',
        responseTime: `${endTime - startTime}ms`
      };
    }

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      message: 'Carrinho removido do Redis',
      storedIn: 'Redis Cloud'
    };
  }

  // Nova rota para estatísticas do cache
  @Get('stats/cache')
  async getCacheStats() {
    return await this.cartService.getCacheStats();
  }

  @Post('add')
  async addItem(@Body() dto: AddCartItemDto) {
    const startTime = Date.now();
    const result = await this.cartService.addItem(dto, 800);
    const endTime = Date.now();

    return {
      ...result,
      responseTime: `${endTime - startTime}ms`,
      message: 'Item adicionado ao carrinho no Redis',
      storedIn: 'Redis Cloud'
    };
  }
}
