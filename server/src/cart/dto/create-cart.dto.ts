import { IsDateString, IsEmail, IsString, ValidateNested } from "class-validator";
import { isDate, isStringObject } from "util/types";
import { CartItemDto } from "./cart-item.dto";
import { Type } from "class-transformer";

export class CreateCartDto {

    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsDateString()
    orderDate: string;

    @ValidateNested({ each: true})
    @Type(() => CartItemDto)
    items: CartItemDto[];
}
