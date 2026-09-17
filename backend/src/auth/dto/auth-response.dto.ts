import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserResponseDto } from "../../users/dto/user-response.dto.js";

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ description: "Send as `Authorization: Bearer <token>`" })
  accessToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: "Bearer";

  @ApiProperty({ description: "Access token lifetime in seconds", example: 900 })
  expiresIn!: number;

  @ApiPropertyOptional({
    description: "Only for `X-Client-Platform: native`. Web clients receive an httpOnly cookie.",
  })
  refreshToken?: string;

  @ApiPropertyOptional({ type: String, format: "date-time", description: "Native clients only." })
  refreshTokenExpiresAt?: Date;
}
