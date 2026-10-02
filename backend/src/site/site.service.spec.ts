import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/auth-user.js";
import { ContentStatus, HeroAutoAdvanceMode, HeroMediaType } from "../generated/prisma/enums.js";
import { SiteService } from "./site.service.js";

describe("SiteService - Hero System", () => {
  const mockAdmin: AuthUser = {
    id: "018f4a3e-72b1-7a6c-9012-3456789abcde",
    role: "ADMIN" as any,
    sessionId: "018f4a3e-72b1-7a6c-9012-3456789abcde",
  };

  it("creates a hero slide with custom duration, autoAdvanceMode and mobileUrl", async () => {
    const mockCreated = {
      id: "slide-1",
      title: "Pass of the Winds",
      eyebrow: "Himalaya Series",
      description: "A fast climb across gravel ridges.",
      location: "Spiti",
      mediaType: HeroMediaType.VIDEO,
      videoUrl: "https://cdn.example.com/desktop.mp4",
      mobileUrl: "https://cdn.example.com/mobile.mp4",
      posterUrl: "https://cdn.example.com/poster.jpg",
      durationSeconds: 15,
      autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
      sortOrder: 0,
      status: ContentStatus.PUBLISHED,
      createdById: mockAdmin.id,
      updatedById: mockAdmin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPrisma = {
      heroSlide: {
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
        create: vi.fn().mockResolvedValue(mockCreated),
      },
    };

    const service = new SiteService(mockPrisma as any);
    const result = await service.createHeroSlide(mockAdmin, {
      title: "Pass of the Winds",
      eyebrow: "Himalaya Series",
      description: "A fast climb across gravel ridges.",
      location: "Spiti",
      mediaType: HeroMediaType.VIDEO,
      videoUrl: "https://cdn.example.com/desktop.mp4",
      mobileUrl: "https://cdn.example.com/mobile.mp4",
      posterUrl: "https://cdn.example.com/poster.jpg",
      durationSeconds: 15,
      autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
    });

    expect(result.durationSeconds).toBe(15);
    expect(result.autoAdvanceMode).toBe(HeroAutoAdvanceMode.VIDEO_END);
    expect(result.mobileUrl).toBe("https://cdn.example.com/mobile.mp4");
    expect(mockPrisma.heroSlide.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationSeconds: 15,
          autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
          mobileUrl: "https://cdn.example.com/mobile.mp4",
        }),
      }),
    );
  });

  it("updates duration and autoAdvanceMode on an existing hero slide", async () => {
    const existing = {
      id: "slide-2",
      title: "Western Ghats",
      durationSeconds: 5,
      autoAdvanceMode: HeroAutoAdvanceMode.FIXED_DURATION,
    };

    const updated = {
      ...existing,
      durationSeconds: 20,
      autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
    };

    const mockPrisma = {
      heroSlide: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(updated),
      },
    };

    const service = new SiteService(mockPrisma as any);
    const result = await service.updateHeroSlide(mockAdmin, "slide-2", {
      durationSeconds: 20,
      autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
    });

    expect(result.durationSeconds).toBe(20);
    expect(result.autoAdvanceMode).toBe(HeroAutoAdvanceMode.VIDEO_END);
    expect(mockPrisma.heroSlide.update).toHaveBeenCalledWith({
      where: { id: "slide-2" },
      data: expect.objectContaining({
        durationSeconds: 20,
        autoAdvanceMode: HeroAutoAdvanceMode.VIDEO_END,
        updatedById: mockAdmin.id,
      }),
    });
  });

  it("archives a hero slide and marks status ARCHIVED", async () => {
    const existing = { id: "slide-3", title: "Monsoon Loop", status: ContentStatus.PUBLISHED };
    const archived = { ...existing, status: ContentStatus.ARCHIVED };

    const mockPrisma = {
      heroSlide: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(archived),
      },
    };

    const service = new SiteService(mockPrisma as any);
    const result = await service.archiveHeroSlide(mockAdmin, "slide-3");

    expect(result.status).toBe(ContentStatus.ARCHIVED);
    expect(mockPrisma.heroSlide.update).toHaveBeenCalledWith({
      where: { id: "slide-3" },
      data: {
        status: ContentStatus.ARCHIVED,
        updatedById: mockAdmin.id,
      },
    });
  });
});
