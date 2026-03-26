package com.smsgateway.queue

/**
 * Implements exponential backoff retry logic for failed SMS messages.
 *
 * Retry schedule:
 *   Attempt 1: 1 minute
 *   Attempt 2: 5 minutes
 *   Attempt 3: 15 minutes
 *   Attempt 4: 30 minutes
 *   Attempt 5+: 60 minutes
 *   Maximum: 20 attempts (configurable per message)
 */
object RetryPolicy {

    private val RETRY_DELAYS_MS = longArrayOf(
        60_000L,         // 1 minute
        300_000L,        // 5 minutes
        900_000L,        // 15 minutes
        1_800_000L,      // 30 minutes
        3_600_000L       // 60 minutes (used for all subsequent retries)
    )

    /**
     * Calculate the next retry time based on the current retry count.
     *
     * @param retryCount Current number of retries (0-based)
     * @return Epoch millisecond timestamp for the next retry
     */
    fun getNextRetryTime(retryCount: Int): Long {
        val delayIndex = retryCount.coerceAtMost(RETRY_DELAYS_MS.size - 1)
        val delay = RETRY_DELAYS_MS[delayIndex]
        return System.currentTimeMillis() + delay
    }

    /**
     * Check if a message should be retried based on its retry count and max retries.
     */
    fun shouldRetry(retryCount: Int, maxRetries: Int): Boolean {
        return retryCount < maxRetries
    }

    /**
     * Check if a message is eligible for retry right now.
     */
    fun isRetryDue(nextRetryAt: Long?): Boolean {
        if (nextRetryAt == null) return true
        return System.currentTimeMillis() >= nextRetryAt
    }
}
