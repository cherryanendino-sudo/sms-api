package com.smsgateway.db

import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * React Native bridge module for database operations.
 */
class DatabaseModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val dao by lazy { AppDatabase.getInstance(reactContext).messageDao() }

    override fun getName(): String = "DatabaseModule"

    @ReactMethod
    fun getMessages(filter: String?, limit: Int, offset: Int, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val messages = if (filter != null && filter.isNotEmpty()) {
                    dao.getByStatus(filter, limit, offset)
                } else {
                    dao.getAll(limit, offset)
                }

                val result = Arguments.createArray()
                for (msg in messages) {
                    result.pushMap(messageToMap(msg))
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getMessage(id: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val msg = dao.getById(id)
                if (msg != null) {
                    promise.resolve(messageToMap(msg))
                } else {
                    promise.resolve(null)
                }
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun deleteMessage(id: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                dao.deleteById(id)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getStats(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = Arguments.createMap().apply {
                    putInt("total", dao.countTotal())
                    putInt("queued", dao.countByStatus("QUEUED"))
                    putInt("sent", dao.countByStatus("SENT"))
                    putInt("delivered", dao.countByStatus("DELIVERED"))
                    putInt("failed", dao.countByStatus("FAILED"))
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    private fun messageToMap(msg: MessageEntity): WritableMap {
        return Arguments.createMap().apply {
            putString("id", msg.id)
            putString("phoneNumber", msg.phoneNumber)
            putString("messageText", msg.messageText)
            putString("status", msg.status)
            if (msg.simSlot != null) putInt("simSlot", msg.simSlot) else putNull("simSlot")
            if (msg.usedSimSlot != null) putInt("usedSimSlot", msg.usedSimSlot) else putNull("usedSimSlot")
            putInt("retryCount", msg.retryCount)
            putInt("maxRetries", msg.maxRetries)
            if (msg.errorCode != null) putString("errorCode", msg.errorCode) else putNull("errorCode")
            putBoolean("webhookSent", msg.webhookSent)
            putDouble("createdAt", msg.createdAt.toDouble())
            if (msg.sentAt != null) putDouble("sentAt", msg.sentAt.toDouble()) else putNull("sentAt")
            if (msg.deliveredAt != null) putDouble("deliveredAt", msg.deliveredAt.toDouble()) else putNull("deliveredAt")
            if (msg.nextRetryAt != null) putDouble("nextRetryAt", msg.nextRetryAt.toDouble()) else putNull("nextRetryAt")
        }
    }
}
