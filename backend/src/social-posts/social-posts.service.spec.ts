import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../auth/auth-user.js";
import { SocialMediaType, SocialPlatform, SocialPostStatus, UserRole } from "../generated/prisma/enums.js";
import { SocialPostsService } from "./social-posts.service.js";

describe("SocialPostsService", () => {
  const mockAdmin: AuthUser = {
    id: "018f4a3e-72b1-7a6c-9012-3456789abcde",
    role: UserRole.ADMIN,
    sessionId: "018f4a3e-72b1-7a6c-9012-3456789abcde",
  };

  it("creates a social post with URL normalization and auto-inferred mediaType", async () => {
    const rawUrl = "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==&utm_source=copy";
    const expectedNormalizedUrl = "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==";

    const mockCreated = {
      id: "post-1",
      postUrl: expectedNormalizedUrl,
      mediaType: SocialMediaType.VIDEO,
      platform: SocialPlatform.INSTAGRAM,
      status: SocialPostStatus.PUBLISHED,
      sortOrder: 0,
      isFeatured: false,
      imageUrl: null,
      videoUrl: null,
      caption: null,
      username: null,
      mediaAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: mockAdmin.id,
      updatedById: mockAdmin.id,
    };

    const mockPrisma = {
      socialPost: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockCreated),
      },
    };

    const mockMediaService = {
      publicUrl: vi.fn(),
      releaseIfUnreferenced: vi.fn(),
    };

    const service = new SocialPostsService(mockPrisma as any, mockMediaService as any);

    const result = await service.create(mockAdmin, {
      postUrl: rawUrl,
      status: SocialPostStatus.PUBLISHED,
    });

    expect(result.id).toBe("post-1");
    expect(result.postUrl).toBe(expectedNormalizedUrl);
    expect(result.mediaType).toBe(SocialMediaType.VIDEO);
    expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postUrl: expectedNormalizedUrl,
          mediaType: SocialMediaType.VIDEO,
          status: SocialPostStatus.PUBLISHED,
          sortOrder: 0,
        }),
      }),
    );
  });

  it("updates post URL and archives a post", async () => {
    const existing = {
      id: "post-2",
      postUrl: "https://www.instagram.com/p/oldpost123/",
      mediaType: SocialMediaType.IMAGE,
      platform: SocialPlatform.INSTAGRAM,
      status: SocialPostStatus.PUBLISHED,
      sortOrder: 1,
      mediaAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: mockAdmin.id,
      updatedById: mockAdmin.id,
    };

    const newUrl = "https://www.instagram.com/reel/newreel123/?utm_campaign=share";
    const expectedNormalized = "https://www.instagram.com/reel/newreel123/";

    const mockPrisma = {
      socialPost: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...existing,
            ...data,
          }),
        ),
      },
    };

    const mockMediaService = {
      publicUrl: vi.fn(),
      releaseIfUnreferenced: vi.fn(),
    };

    const service = new SocialPostsService(mockPrisma as any, mockMediaService as any);

    // Update URL
    const updated = await service.update(mockAdmin, "post-2", {
      postUrl: newUrl,
    });

    expect(updated.postUrl).toBe(expectedNormalized);
    expect(updated.mediaType).toBe(SocialMediaType.VIDEO);

    // Archive
    const archived = await service.archive(mockAdmin, "post-2");
    expect(archived.status).toBe(SocialPostStatus.ARCHIVED);
  });

  it("reorders social posts in transaction", async () => {
    const mockPrisma = {
      $transaction: vi.fn().mockResolvedValue([]),
      socialPost: {
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "post-b",
            sortOrder: 0,
            status: SocialPostStatus.PUBLISHED,
            postUrl: "https://www.instagram.com/p/b/",
            mediaType: SocialMediaType.IMAGE,
            platform: SocialPlatform.INSTAGRAM,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "post-a",
            sortOrder: 1,
            status: SocialPostStatus.PUBLISHED,
            postUrl: "https://www.instagram.com/p/a/",
            mediaType: SocialMediaType.IMAGE,
            platform: SocialPlatform.INSTAGRAM,
            isFeatured: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      },
    };

    const mockMediaService = {
      publicUrl: vi.fn(),
      releaseIfUnreferenced: vi.fn(),
    };

    const service = new SocialPostsService(mockPrisma as any, mockMediaService as any);
    const result = await service.reorder(mockAdmin, { postIds: ["post-b", "post-a"] });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("post-b");
    expect(result[1].id).toBe("post-a");
  });

  it("listPublic returns only published posts in sortOrder", async () => {
    const mockRows = [
      {
        id: "post-1",
        postUrl: "https://www.instagram.com/reel/1/",
        mediaType: SocialMediaType.VIDEO,
        platform: SocialPlatform.INSTAGRAM,
        status: SocialPostStatus.PUBLISHED,
        sortOrder: 0,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "post-2",
        postUrl: "https://www.instagram.com/p/2/",
        mediaType: SocialMediaType.IMAGE,
        platform: SocialPlatform.INSTAGRAM,
        status: SocialPostStatus.PUBLISHED,
        sortOrder: 1,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockPrisma = {
      socialPost: {
        findMany: vi.fn().mockResolvedValue(mockRows),
      },
    };

    const service = new SocialPostsService(mockPrisma as any, {} as any);
    const result = await service.listPublic();

    expect(result).toHaveLength(2);
    expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith({
      where: { status: SocialPostStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { mediaAsset: true },
    });
  });
});
