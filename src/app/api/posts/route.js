import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  setCorsHeaders,
} from "../../../lib/middleware.js";

const prisma = new PrismaClient();

// GET /api/posts - Get all posts with pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeAnalysis = searchParams.get("includeAnalysis") === "true";

    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: [
          { isLocal: "desc" }, // Local posts first
          { id: "asc" }, // Then by ID ascending (1, 2, 3...)
        ],
        include: {
          analysis: includeAnalysis
            ? {
                orderBy: { createdAt: "desc" },
                take: 1, // Get latest analysis
              }
            : false,
          user: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
      }),
      prisma.post.count(),
    ]);

    const response = createSuccessResponse({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalPosts: totalCount,
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1,
      },
    });

    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    const response = createErrorResponse("Failed to fetch posts", 500);
    return setCorsHeaders(response);
  }
}

// POST /api/posts - Create new post (requires API key)
export async function POST(request) {
  try {
    // Validate API key and permissions
    const authResult = await withAuth(request, "CREATE_POST");
    if (!authResult.success) {
      const response = createErrorResponse(authResult.error, authResult.status);
      return setCorsHeaders(response);
    }

    const body = await request.json();
    const { title, body: postBody, userId = 1 } = body;

    // Validate required fields
    if (!title || !postBody) {
      const response = createErrorResponse("Title and body are required", 400);
      return setCorsHeaders(response);
    }

    // Ensure user exists (create if needed)
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: `User ${userId}`,
          username: `user${userId}`,
          email: `user${userId}@example.com`,
        },
      });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        body: postBody.trim(),
        userId,
        isLocal: true,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    });

    const response = createSuccessResponse(post, 201);
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error creating post:", error);
    const response = createErrorResponse("Failed to create post", 500);
    return setCorsHeaders(response);
  }
}

// OPTIONS /api/posts - Handle CORS preflight
export async function OPTIONS(request) {
  return setCorsHeaders(new Response(null, { status: 200 }));
}
