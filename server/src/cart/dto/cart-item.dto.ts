import { IsNumber, IsString, Min } from "class-validator";

export class CartItemDto {
    
    @IsString()
    product: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(1)
    quantity: number;
}