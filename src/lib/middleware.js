import { apiKeysDB } from "./database.js";

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

  const validatedKey = await apiKeysDB.validateApiKey(apiKey);

  if (!validatedKey) {
    return {
      isValid: false,
      error: "Invalid or inactive API key",
      status: 401,
    };
  }

  return {
    isValid: true,
    apiKey: validatedKey,
  };
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

// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map();

export function rateLimit(identifier, windowMs = 60000, maxRequests = 100) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean old entries
  const requests = rateLimitStore.get(identifier) || [];
  const validRequests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    return {
      allowed: false,
      resetTime: validRequests[0] + windowMs,
      remaining: 0,
    };
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);

  return {
    allowed: true,
    remaining: maxRequests - validRequests.length,
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
