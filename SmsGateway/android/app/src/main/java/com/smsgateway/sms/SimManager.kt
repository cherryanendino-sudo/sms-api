package com.smsgateway.sms

import android.content.Context
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import com.smsgateway.db.AppDatabase
import com.smsgateway.db.DailyCountEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicInteger

/**
 * Manages dual-SIM detection and round-robin rotation.
 */
class SimManager(private val context: Context) {

    private val subscriptionManager: SubscriptionManager by lazy {
        context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
    }

    private val lastUsedSim = AtomicInteger(0) // 0 = none yet, 1 or 2

    /**
     * Get all active SIM subscriptions.
     */
    fun getActiveSubscriptions(): List<SubscriptionInfo> {
        return try {
            subscriptionManager.activeSubscriptionInfoList ?: emptyList()
        } catch (e: SecurityException) {
            emptyList()
        }
    }

    /**
     * Get the subscription ID for a given SIM slot (1-based).
     * Returns null if the slot is not available.
     */
    fun getSubscriptionIdForSlot(slot: Int): Int? {
        val subs = getActiveSubscriptions()
        return subs.find { it.simSlotIndex == (slot - 1) }?.subscriptionId
    }

    /**
     * Select the next SIM slot using round-robin rotation.
     * If a specific slot is requested and available, use that instead.
     */
    fun selectNextSim(requestedSlot: Int? = null): Int? {
        val subs = getActiveSubscriptions()
        if (subs.isEmpty()) return null

        if (requestedSlot != null) {
            val sub = subs.find { it.simSlotIndex == (requestedSlot - 1) }
            if (sub != null) return requestedSlot
        }

        // Round-robin
        if (subs.size == 1) {
            val slot = subs[0].simSlotIndex + 1
            lastUsedSim.set(slot)
            return slot
        }

        val last = lastUsedSim.get()
        val nextSlot = if (last == 1) 2 else 1

        // Verify the next slot actually has a SIM
        val sub = subs.find { it.simSlotIndex == (nextSlot - 1) }
        return if (sub != null) {
            lastUsedSim.set(nextSlot)
            nextSlot
        } else {
            // Fall back to the other slot
            val fallback = if (nextSlot == 1) 2 else 1
            lastUsedSim.set(fallback)
            fallback
        }
    }

    /**
     * Get the current date string for daily count tracking.
     */
    private fun todayString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    /**
     * Increment the daily send count for a given SIM slot.
     */
    suspend fun incrementDailyCount(simSlot: Int) {
        withContext(Dispatchers.IO) {
            val dao = AppDatabase.getInstance(context).messageDao()
            val today = todayString()
            val existing = dao.getDailyCount(today) ?: DailyCountEntity(date = today)

            val updated = when (simSlot) {
                1 -> existing.copy(sim1Count = existing.sim1Count + 1)
                2 -> existing.copy(sim2Count = existing.sim2Count + 1)
                else -> existing
            }
            dao.upsertDailyCount(updated)
        }
    }

    /**
     * Get the daily send count for a specific SIM slot.
     */
    suspend fun getDailyCount(simSlot: Int): Int {
        return withContext(Dispatchers.IO) {
            val dao = AppDatabase.getInstance(context).messageDao()
            val today = todayString()
            val counts = dao.getDailyCount(today)
            when (simSlot) {
                1 -> counts?.sim1Count ?: 0
                2 -> counts?.sim2Count ?: 0
                else -> 0
            }
        }
    }

    /**
     * Check if the daily limit has been reached for a given SIM slot.
     */
    suspend fun isDailyLimitReached(simSlot: Int, limit: Int): Boolean {
        return getDailyCount(simSlot) >= limit
    }
}
