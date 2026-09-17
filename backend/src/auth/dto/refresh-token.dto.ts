import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

/** Web clients send nothing (the httpOnly cookie is used); native clients send the token. */
export class RefreshTokenDto {
  @ApiPropertyOptional({ description: "Native clients only. Web clients rely on the cookie." })
  @IsOptional()
  @IsString()
  @Length(20, 256)
  refreshToken?: string;
}
