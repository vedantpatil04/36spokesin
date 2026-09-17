import { ApiProperty } from "@nestjs/swagger";

export class RiderAvatarDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  url!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  width!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  height!: number | null;

  @ApiProperty({ type: String, nullable: true })
  altText!: string | null;
}

export class RiderProfileResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  userId!: string;

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  bio!: string | null;

  @ApiProperty({ type: String, nullable: true })
  city!: string | null;

  @ApiProperty({ type: RiderAvatarDto, nullable: true })
  avatar!: RiderAvatarDto | null;

  @ApiProperty({ type: String, format: "date-time", description: "When the rider joined" })
  memberSince!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
