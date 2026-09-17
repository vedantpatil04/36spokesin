import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import type { RiderProfileResponseDto } from "./dto/rider-profile-response.dto.js";
import type { UpdateRiderProfileDto } from "./dto/update-rider-profile.dto.js";

const riderProfileSelect = {
  id: true,
  userId: true,
  displayName: true,
  bio: true,
  city: true,
  createdAt: true,
  updatedAt: true,
  avatar: {
    select: { id: true, storageKey: true, width: true, height: true, altText: true },
  },
} satisfies Prisma.RiderProfileSelect;

type RiderProfileRow = Prisma.RiderProfileGetPayload<{ select: typeof riderProfileSelect }>;

@Injectable()
export class RidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async getOwn(userId: string): Promise<RiderProfileResponseDto> {
    const profile =
      (await this.prisma.riderProfile.findUnique({
        where: { userId },
        select: riderProfileSelect,
      })) ??
      // Accounts created outside registration (e.g. the admin CLI) get a profile on first use.
      (await this.prisma.riderProfile.create({ data: { userId }, select: riderProfileSelect }));
    return this.toResponse(profile);
  }

  async updateOwn(userId: string, dto: UpdateRiderProfileDto): Promise<RiderProfileResponseDto> {
    if (dto.avatarMediaId) {
      await this.media.assertUsableByOwner(userId, dto.avatarMediaId, MediaCategory.RIDER);
    }

    const data = {
      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
      ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.avatarMediaId !== undefined ? { avatarMediaId: dto.avatarMediaId } : {}),
    };

    const profile = await this.prisma.riderProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: riderProfileSelect,
    });
    return this.toResponse(profile);
  }

  private toResponse(profile: RiderProfileRow): RiderProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      city: profile.city,
      avatar: profile.avatar
        ? {
            id: profile.avatar.id,
            url: this.media.publicUrl(profile.avatar.storageKey),
            width: profile.avatar.width,
            height: profile.avatar.height,
            altText: profile.avatar.altText,
          }
        : null,
      memberSince: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
