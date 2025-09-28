import { CartItemDto } from '../dto/cart-item.dto';

export class Cart {
  id: number;
  name: string;
  email: string;
  orderDate: string;
  items: CartItemDto[];
  total: number;
}
