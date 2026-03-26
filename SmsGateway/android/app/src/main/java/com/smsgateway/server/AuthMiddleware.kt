package com.smsgateway.server

/**
 * Validates Bearer token authentication for incoming HTTP requests.
 */
class AuthMiddleware(private var apiKey: String) {

    fun updateApiKey(newKey: String) {
        apiKey = newKey
    }

    /**
     * Validate the Authorization header value.
     * Expected format: "Bearer <api-key>"
     *
     * @return true if the token is valid
     */
    fun isAuthorized(authHeader: String?): Boolean {
        if (apiKey.isEmpty()) return true // No key configured = open access
        if (authHeader == null) return false

        val parts = authHeader.trim().split(" ", limit = 2)
        if (parts.size != 2) return false
        if (!parts[0].equals("Bearer", ignoreCase = true)) return false

        return parts[1] == apiKey
    }
}
