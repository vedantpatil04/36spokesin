import { ApiProperty } from "@nestjs/swagger";
import { ImageDto } from "../../catalog/dto/catalog-response.dto.js";
import { BikeSegment } from "../../generated/prisma/enums.js";

export class BikeBrandRefDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ example: "Royal Enfield" })
  name!: string;
}

export class BikeVariantDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Kaza Brown" })
  name!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  archivedAt!: Date | null;
}

export class BikeModelDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "royal-enfield-himalayan-450" })
  slug!: string;

  @ApiProperty({ example: "Himalayan 450" })
  name!: string;

  @ApiProperty({ type: BikeBrandRefDto })
  brand!: BikeBrandRefDto;

  @ApiProperty({ enum: BikeSegment, enumName: "BikeSegment" })
  segment!: BikeSegment;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  displacementCc!: number | null;

  @ApiProperty({ type: Number, nullable: true, description: "Approximate km per litre" })
  fuelEfficiencyKmpl!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  tankLitres!: number | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  image!: ImageDto | null;

  @ApiProperty({
    type: [BikeVariantDto],
    description: "Public responses list active variants only",
  })
  variants!: BikeVariantDto[];
}

export class AdminBikeModelDto extends BikeModelDto {
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  archivedAt!: Date | null;

  @ApiProperty({ description: "Riders who have this model in their garage" })
  riderCount!: number;

  @ApiProperty({ description: "Product fitment entries that name this model" })
  productCount!: number;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class BikeBrandDto extends BikeBrandRefDto {
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  archivedAt!: Date | null;

  @ApiProperty()
  modelCount!: number;
}
