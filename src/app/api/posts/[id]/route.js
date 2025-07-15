import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  withAuth,
  createErrorResponse,
  createSuccessResponse,
  setCorsHeaders,
} from "../../../../lib/middleware.js";

const prisma = new PrismaClient();

// GET /api/posts/[id] - Get single post
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeAnalysis = searchParams.get("includeAnalysis") !== "false"; // Default to true

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!post) {
      const response = createErrorResponse("Post not found", 404);
      return setCorsHeaders(response);
    }

    const response = createSuccessResponse(post);
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching post:", error);
    const response = createErrorResponse("Failed to fetch post", 500);
    return setCorsHeaders(response);
  }
}

// PUT /api/posts/[id] - Update post (requires API key)
export async function PUT(request, { params }) {
  try {
    // Validate API key and permissions
    const authResult = await withAuth(request, "UPDATE_POST");
    if (!authResult.success) {
      const response = createErrorResponse(authResult.error, authResult.status);
      return setCorsHeaders(response);
    }

    const { id } = params;
    const body = await request.json();
    const { title, body: postBody } = body;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      const response = createErrorResponse("Post not found", 404);
      return setCorsHeaders(response);
    }

    // Update post
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (postBody !== undefined) updateData.body = postBody.trim();

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    });

    const response = createSuccessResponse(updatedPost);
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error updating post:", error);
    const response = createErrorResponse("Failed to update post", 500);
    return setCorsHeaders(response);
  }
}

// DELETE /api/posts/[id] - Delete post (requires API key)
export async function DELETE(request, { params }) {
  try {
    // Validate API key and permissions
    const authResult = await withAuth(request, "DELETE_POST");
    if (!authResult.success) {
      const response = createErrorResponse(authResult.error, authResult.status);
      return setCorsHeaders(response);
    }

    const { id } = params;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      const response = createErrorResponse("Post not found", 404);
      return setCorsHeaders(response);
    }

    // Delete post (this will cascade delete analysis records)
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    const response = createSuccessResponse({
      message: "Post deleted successfully",
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error deleting post:", error);
    const response = createErrorResponse("Failed to delete post", 500);
    return setCorsHeaders(response);
  }
}

// OPTIONS /api/posts/[id] - Handle CORS preflight
export async function OPTIONS(request) {
  return setCorsHeaders(new Response(null, { status: 200 }));
}
