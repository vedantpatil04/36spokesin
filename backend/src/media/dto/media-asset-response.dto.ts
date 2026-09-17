import { ApiProperty } from "@nestjs/swagger";
import { MediaCategory, MediaStatus } from "../../generated/prisma/enums.js";

export class MediaAssetResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Public URL; null until the upload is completed",
  })
  url!: string | null;

  @ApiProperty({ enum: MediaCategory, enumName: "MediaCategory" })
  category!: MediaCategory;

  @ApiProperty({ enum: MediaStatus, enumName: "MediaStatus" })
  status!: MediaStatus;

  @ApiProperty()
  originalFileName!: string;

  @ApiProperty({ example: "image/webp" })
  mimeType!: string;

  @ApiProperty({ description: "Bytes" })
  fileSize!: number;

  @ApiProperty({ type: Number, nullable: true })
  width!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  height!: number | null;

  @ApiProperty({ type: String, nullable: true })
  altText!: string | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  uploadedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class PresignedUploadDto {
  @ApiProperty({ description: "Pre-signed storage URL. Upload the raw file bytes here." })
  url!: string;

  @ApiProperty({ example: "PUT" })
  method!: "PUT";

  @ApiProperty({
    type: "object",
    additionalProperties: { type: "string" },
    example: { "Content-Type": "image/jpeg" },
  })
  headers!: Record<string, string>;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt!: Date;
}

export class UploadSessionResponseDto {
  @ApiProperty({ type: MediaAssetResponseDto })
  asset!: MediaAssetResponseDto;

  @ApiProperty({ type: PresignedUploadDto })
  upload!: PresignedUploadDto;
}
