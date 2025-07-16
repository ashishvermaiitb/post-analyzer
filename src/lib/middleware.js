import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API Key validation middleware
export async function validateApiKey(request) {
  const apiKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return {
      isValid: false,
      error: "API key is required",
      status: 401,
    };
  }

  try {
    const validatedKey = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        id: true,
        name: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!validatedKey || !validatedKey.isActive) {
      return {
        isValid: false,
        error: "Invalid or inactive API key",
        status: 401,
      };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });

    return {
      isValid: true,
      apiKey: validatedKey,
    };
  } catch (error) {
    console.error("Error validating API key:", error);
    return {
      isValid: false,
      error: "Internal server error",
      status: 500,
    };
  }
}

// Permission check middleware
export function checkPermission(apiKey, requiredPermission) {
  if (
    !apiKey.permissions.includes(requiredPermission) &&
    !apiKey.permissions.includes("ALL")
  ) {
    return {
      hasPermission: false,
      error: `Insufficient permissions. Required: ${requiredPermission}`,
      status: 403,
    };
  }

  return {
    hasPermission: true,
  };
}

// Combined middleware for protected routes
export async function withAuth(request, requiredPermission = null) {
  // Validate API key
  const keyValidation = await validateApiKey(request);

  if (!keyValidation.isValid) {
    return {
      success: false,
      error: keyValidation.error,
      status: keyValidation.status,
    };
  }

  // Check permission if required
  if (requiredPermission) {
    const permissionCheck = checkPermission(
      keyValidation.apiKey,
      requiredPermission
    );

    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        error: permissionCheck.error,
        status: permissionCheck.status,
      };
    }
  }

  return {
    success: true,
    apiKey: keyValidation.apiKey,
  };
}

// CORS helper
export function setCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );
  return response;
}

// Error response helper
export function createErrorResponse(message, status = 400, details = null) {
  const errorBody = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    errorBody.details = details;
  }

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Success response helper
export function createSuccessResponse(data, status = 200, meta = null) {
  const responseBody = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    responseBody.meta = meta;
  }

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
