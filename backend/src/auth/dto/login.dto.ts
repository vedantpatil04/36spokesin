import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { normaliseEmail } from "../../common/validation/transforms.js";
import { PASSWORD_MAX_LENGTH } from "./register.dto.js";

export class LoginDto {
  @ApiProperty({ example: "rider@example.com" })
  @Transform(normaliseEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ format: "password" })
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
