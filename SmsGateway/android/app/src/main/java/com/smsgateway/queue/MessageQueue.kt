package com.smsgateway.queue

import android.content.Context
import android.content.IntentFilter
import com.smsgateway.db.AppDatabase
import com.smsgateway.db.ActivityLogEntity
import com.smsgateway.sms.SimManager
import com.smsgateway.sms.SmsDispatcher
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Orchestrates the message queue processing loop.
 * Picks up QUEUED messages from the database, applies throttling delay,
 * selects the appropriate SIM, and dispatches via SmsDispatcher.
 */
class MessageQueue(private val context: Context) {

    private val dao by lazy { AppDatabase.getInstance(context).messageDao() }
    private val simManager by lazy { SimManager(context) }
    private val smsDispatcher by lazy { SmsDispatcher(context) }

    private var processingJob: Job? = null
    private val isProcessing = AtomicBoolean(false)

    var delayBetweenMessagesMs: Long = 20_000L // 20 seconds default
    var dailyLimitPerSim: Int = 700

    /**
     * Start the queue processing loop.
     */
    fun start() {
        if (isProcessing.getAndSet(true)) return

        processingJob = CoroutineScope(Dispatchers.IO).launch {
            while (isActive && isProcessing.get()) {
                try {
                    processNextMessage()
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    log("ERROR", "Queue processing error: ${e.message}")
                }
                delay(delayBetweenMessagesMs)
            }
        }
    }

    /**
     * Stop the queue processing loop.
     */
    fun stop() {
        isProcessing.set(false)
        processingJob?.cancel()
        processingJob = null
    }

    fun isRunning(): Boolean = isProcessing.get()

    /**
     * Process the next message in the queue (either a new QUEUED message or a retryable FAILED one).
     */
    private suspend fun processNextMessage() {
        // First try to get a queued message
        var message = dao.getNextQueued()

        // If no queued messages, try a retryable failed message
        if (message == null) {
            message = dao.getNextRetryable()
        }

        if (message == null) return // Nothing to process

        // Select SIM
        val simSlot = simManager.selectNextSim(message.simSlot)
        if (simSlot == null) {
            log("ERROR", "No SIM available for message ${message.id}")
            dao.update(message.copy(status = "FAILED", errorCode = "NO_SIM_AVAILABLE"))
            return
        }

        // Check daily limit
        if (simManager.isDailyLimitReached(simSlot, dailyLimitPerSim)) {
            log("WARN", "Daily limit reached for SIM $simSlot, pausing queue")
            // Don't mark as failed, just skip for now
            return
        }

        // Get subscription ID for the selected SIM
        val subscriptionId = simManager.getSubscriptionIdForSlot(simSlot)

        // Update status to SENDING
        dao.update(message.copy(status = "SENDING", usedSimSlot = simSlot))

        log("INFO", "Sending message ${message.id} to ${message.phoneNumber} via SIM $simSlot")

        try {
            // Dispatch the SMS
            smsDispatcher.sendSms(
                messageId = message.id,
                phoneNumber = message.phoneNumber,
                messageText = message.messageText,
                subscriptionId = subscriptionId
            )

            // Increment daily counter
            simManager.incrementDailyCount(simSlot)

        } catch (e: Exception) {
            log("ERROR", "Failed to send message ${message.id}: ${e.message}")

            val retryCount = message.retryCount + 1
            if (RetryPolicy.shouldRetry(retryCount, message.maxRetries)) {
                val nextRetry = RetryPolicy.getNextRetryTime(retryCount)
                dao.update(
                    message.copy(
                        status = "FAILED",
                        retryCount = retryCount,
                        errorCode = e.message ?: "DISPATCH_ERROR",
                        nextRetryAt = nextRetry
                    )
                )
            } else {
                dao.update(
                    message.copy(
                        status = "FAILED",
                        retryCount = retryCount,
                        errorCode = "MAX_RETRIES_EXCEEDED"
                    )
                )
            }
        }
    }

    private suspend fun log(level: String, message: String) {
        try {
            dao.insertLog(ActivityLogEntity(level = level, message = message))
        } catch (_: Exception) {
            // Don't let logging failures break the queue
        }
    }
}
