import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { PrismaService } from "../database/prisma.service.js";
import { ContentStatus, HeroAutoAdvanceMode, HeroMediaType } from "../generated/prisma/enums.js";
import type {
  CreateHeroSlideDto,
  ReorderHeroSlidesDto,
  UpdateHeroSlideDto,
} from "./dto/hero-slide-input.dto.js";
import type { HeroSlideDto } from "./dto/hero-slide-response.dto.js";
import type { ReorderPathCardsDto, UpdatePathCardDto } from "./dto/path-card-input.dto.js";
import type { PathCardDto } from "./dto/path-card-response.dto.js";

const DEFAULT_HERO_SLIDES = [
  {
    title: "The road starts where the map runs out",
    eyebrow: "Official 36 Spokes Rider Network",
    description:
      "Expeditions across the Himalaya, gear matched to the motorcycle in your garage, and riders who turn up when you post a route.",
    location: "Ladakh & Spiti Valley",
    mediaType: HeroMediaType.IMAGE,
    ctaLabel: "Choose your path",
    ctaUrl: "#choose-your-path",
    secondaryCtaLabel: "Plan a journey",
    secondaryCtaUrl: "/plan",
    durationSeconds: 5,
    autoAdvanceMode: HeroAutoAdvanceMode.FIXED_DURATION,
    sortOrder: 0,
    status: ContentStatus.PUBLISHED,
  },
  {
    title: "Above the tree line, under the prayers",
    eyebrow: "Himalayan Expedition Series",
    description:
      "High-altitude mountain passes, remote gravel valleys, and fixed-departure journeys built for small, disciplined packs.",
    location: "Zanskar Gorge & Shinkula Pass",
    mediaType: HeroMediaType.IMAGE,
    ctaLabel: "Plan your journey",
    ctaUrl: "/plan",
    secondaryCtaLabel: "Upcoming Rides",
    secondaryCtaUrl: "/rides",
    durationSeconds: 7,
    autoAdvanceMode: HeroAutoAdvanceMode.FIXED_DURATION,
    sortOrder: 1,
    status: ContentStatus.PUBLISHED,
  },
  {
    title: "Built by riders who know the weight of a tool roll",
    eyebrow: "The Human Saddle",
    description:
      "Weekend day-loops, technical workshop nights, and the collective memory of every road taken together.",
    location: "Western Ghats & Sahyadris",
    mediaType: HeroMediaType.IMAGE,
    ctaLabel: "Join the community",
    ctaUrl: "/community",
    secondaryCtaLabel: "Meet the Founders",
    secondaryCtaUrl: "/about",
    durationSeconds: 5,
    autoAdvanceMode: HeroAutoAdvanceMode.FIXED_DURATION,
    sortOrder: 2,
    status: ContentStatus.PUBLISHED,
  },
];

const DEFAULT_PATH_CARDS = [
  {
    slug: "rides",
    title: "Rides",
    tagline: "Routes, weekend runs and group rides near you.",
    description: "From Sahyadri ghat scrambles to Sunday sunrise loops.",
    ctaLabel: "Find a ride",
    destinationUrl: "/rides",
    badge: null,
    sortOrder: 0,
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: "plan",
    title: "Plan",
    tagline: "Custom journeys, route blueprints, and day-by-day itineraries.",
    description: "Map out waypoints, seasonal weather, fuel limits, and stays.",
    ctaLabel: "Plan your journey",
    destinationUrl: "/plan",
    badge: null,
    sortOrder: 1,
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: "shop",
    title: "Shop",
    tagline: "Curated protection and carry gear matched to your motorcycle.",
    description: "Hard-tested armor and luggage systems.",
    ctaLabel: "Preview gear",
    destinationUrl: "/shop",
    badge: "Coming soon",
    sortOrder: 2,
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: "garage",
    title: "Garage",
    tagline: "Your motorcycle, maintenance log, and setup checklist.",
    description: "Keep track of every mod, service interval, and bolt check.",
    ctaLabel: "View garage",
    destinationUrl: "/garage",
    badge: "Coming soon",
    sortOrder: 3,
    status: ContentStatus.PUBLISHED,
  },
  {
    slug: "community",
    title: "Community",
    tagline: "Founders, rider stories, regional chapters, and the road shared.",
    description: "The human side of 36 Spokes across India.",
    ctaLabel: "Enter community",
    destinationUrl: "/community",
    badge: null,
    sortOrder: 4,
    status: ContentStatus.PUBLISHED,
  },
];

@Injectable()
export class SiteService implements OnModuleInit {
  private readonly logger = new Logger(SiteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }

  async seedIfEmpty(): Promise<void> {
    try {
      const heroCount = await this.prisma.heroSlide.count();
      if (heroCount === 0) {
        this.logger.log("Seeding initial hero slides...");
        for (const slide of DEFAULT_HERO_SLIDES) {
          await this.prisma.heroSlide.create({ data: slide });
        }
      }

      const pathCount = await this.prisma.pathCard.count();
      if (pathCount === 0) {
        this.logger.log("Seeding initial path cards...");
        for (const card of DEFAULT_PATH_CARDS) {
          await this.prisma.pathCard.create({ data: card });
        }
      }
    } catch (error) {
      this.logger.warn(`Could not verify/seed site content on startup: ${error}`);
    }
  }

  // ─── Hero Slides ────────────────────────────────────────────────────────────

  async listPublicHeroSlides(): Promise<HeroSlideDto[]> {
    return this.prisma.heroSlide.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async adminListHeroSlides(): Promise<HeroSlideDto[]> {
    return this.prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async adminGetHeroSlide(id: string): Promise<HeroSlideDto> {
    const slide = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException(`Hero slide ${id} not found`);
    return slide;
  }

  async createHeroSlide(admin: AuthUser, dto: CreateHeroSlideDto): Promise<HeroSlideDto> {
    const maxSort = await this.prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
    const sortOrder = dto.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1;

    return this.prisma.heroSlide.create({
      data: {
        ...dto,
        sortOrder,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  async updateHeroSlide(
    admin: AuthUser,
    id: string,
    dto: UpdateHeroSlideDto,
  ): Promise<HeroSlideDto> {
    await this.adminGetHeroSlide(id);
    return this.prisma.heroSlide.update({
      where: { id },
      data: {
        ...dto,
        updatedById: admin.id,
      },
    });
  }

  async archiveHeroSlide(admin: AuthUser, id: string): Promise<HeroSlideDto> {
    await this.adminGetHeroSlide(id);
    return this.prisma.heroSlide.update({
      where: { id },
      data: {
        status: ContentStatus.ARCHIVED,
        updatedById: admin.id,
      },
    });
  }

  async reorderHeroSlides(dto: ReorderHeroSlidesDto): Promise<HeroSlideDto[]> {
    const existing = await this.prisma.heroSlide.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true },
    });
    if (existing.length !== dto.ids.length) {
      throw new BadRequestException("One or more hero slide IDs are invalid");
    }

    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.heroSlide.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.adminListHeroSlides();
  }

  // ─── Path Cards ─────────────────────────────────────────────────────────────

  async listPublicPathCards(): Promise<PathCardDto[]> {
    return this.prisma.pathCard.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async adminListPathCards(): Promise<PathCardDto[]> {
    return this.prisma.pathCard.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async adminGetPathCard(id: string): Promise<PathCardDto> {
    const card = await this.prisma.pathCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException(`Path card ${id} not found`);
    return card;
  }

  async updatePathCard(id: string, dto: UpdatePathCardDto): Promise<PathCardDto> {
    await this.adminGetPathCard(id);
    return this.prisma.pathCard.update({
      where: { id },
      data: dto,
    });
  }

  async reorderPathCards(dto: ReorderPathCardsDto): Promise<PathCardDto[]> {
    const existing = await this.prisma.pathCard.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true },
    });
    if (existing.length !== dto.ids.length) {
      throw new BadRequestException("One or more path card IDs are invalid");
    }

    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.pathCard.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.adminListPathCards();
  }
}
