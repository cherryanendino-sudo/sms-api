package com.smsgateway.queue

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.smsgateway.db.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * React Native bridge module for message queue operations.
 */
class QueueModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val messageQueue by lazy { MessageQueue(reactContext) }
    private val dao by lazy { AppDatabase.getInstance(reactContext).messageDao() }

    override fun getName(): String = "QueueModule"

    @ReactMethod
    fun startProcessing(promise: Promise) {
        try {
            messageQueue.start()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("QUEUE_START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopProcessing(promise: Promise) {
        try {
            messageQueue.stop()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("QUEUE_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getQueueStats(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val queued = dao.countByStatus("QUEUED")
                val sent = dao.countByStatus("SENT")
                val delivered = dao.countByStatus("DELIVERED")
                val failed = dao.countByStatus("FAILED")

                val result = Arguments.createMap().apply {
                    putInt("queued", queued)
                    putInt("sent", sent)
                    putInt("delivered", delivered)
                    putInt("failed", failed)
                    putBoolean("processing", messageQueue.isRunning())
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("QUEUE_STATS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun retryMessage(messageId: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val message = dao.getById(messageId)
                if (message != null && message.status == "FAILED") {
                    dao.update(
                        message.copy(
                            status = "QUEUED",
                            retryCount = 0,
                            errorCode = null,
                            nextRetryAt = null
                        )
                    )
                    promise.resolve(null)
                } else {
                    promise.reject("RETRY_ERROR", "Message not found or not in FAILED status")
                }
            } catch (e: Exception) {
                promise.reject("RETRY_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun clearCompleted(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                dao.deleteCompleted()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("CLEAR_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
