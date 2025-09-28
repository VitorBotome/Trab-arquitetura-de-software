import { Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';  // importei daqui

@Injectable()
export class CartService {
  private carts: Cart[] = [];
  private nextId = 1;

  async create(createCartDto: CreateCartDto): Promise<Cart>  {
    await new Promise(resolve => setTimeout(resolve, 2000));
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

    this.carts.push(newCart);
    return newCart;
  }

  findAll(): Cart[] {
    return this.carts;
  }

  findOne(id: number): Cart | undefined {
    return this.carts.find((cart) => cart.id === id);
  }

  update(id: number, updateCartDto: UpdateCartDto): Cart | null {
    const cartIndex = this.carts.findIndex((cart) => cart.id === id);
    if (cartIndex === -1) return null;

    const existingCart = this.carts[cartIndex];
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

    this.carts[cartIndex] = updatedCart;
    return updatedCart;
  }

  remove(id: number): Cart | null {
    const index = this.carts.findIndex((cart) => cart.id === id);
    if (index === -1) return null;

    const deleted = this.carts[index];
    this.carts.splice(index, 1);
    return deleted;
  }
}
