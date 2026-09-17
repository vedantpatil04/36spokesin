import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../generated/prisma/enums.js";

export class UserResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "rider@example.com" })
  email!: string;

  @ApiProperty({ example: "Aarav" })
  firstName!: string;

  @ApiProperty({ type: String, nullable: true, example: "Sharma" })
  lastName!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "+919876543210" })
  phone!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
