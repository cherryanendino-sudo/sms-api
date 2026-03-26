package com.smsgateway.webhook

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * HTTP client for sending delivery status webhooks to the backend server.
 */
class WebhookClient(private val context: Context) {

    companion object {
        private const val PREFS_NAME = "sms_gateway_webhook"
        private const val KEY_WEBHOOK_URL = "webhook_url"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val httpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build()
    }

    fun getWebhookUrl(): String? = prefs.getString(KEY_WEBHOOK_URL, null)

    fun setWebhookUrl(url: String) {
        prefs.edit().putString(KEY_WEBHOOK_URL, url).apply()
    }

    /**
     * Send a delivery status webhook to the configured URL.
     */
    suspend fun sendDeliveryStatus(
        messageId: String,
        status: String,
        simSlot: Int,
        deliveredAt: Long? = null,
        sentAt: Long? = null,
        errorCode: String? = null
    ): Boolean {
        val url = getWebhookUrl() ?: return false
        if (url.isEmpty()) return false

        return withContext(Dispatchers.IO) {
            try {
                val payload = JSONObject().apply {
                    put("messageId", messageId)
                    put("status", status)
                    put("simSlot", simSlot)
                    if (deliveredAt != null) {
                        put("deliveredAt", java.time.Instant.ofEpochMilli(deliveredAt).toString())
                    }
                    if (sentAt != null) {
                        put("sentAt", java.time.Instant.ofEpochMilli(sentAt).toString())
                    }
                    if (errorCode != null) {
                        put("errorCode", errorCode)
                    }
                }

                val request = Request.Builder()
                    .url(url)
                    .post(payload.toString().toRequestBody(JSON_MEDIA_TYPE))
                    .header("Content-Type", "application/json")
                    .build()

                val response = httpClient.newCall(request).execute()
                response.isSuccessful
            } catch (e: Exception) {
                false
            }
        }
    }

    /**
     * Send a test webhook to verify the URL is reachable.
     */
    suspend fun testWebhook(): Pair<Boolean, Int> {
        val url = getWebhookUrl() ?: return Pair(false, 0)
        if (url.isEmpty()) return Pair(false, 0)

        return withContext(Dispatchers.IO) {
            try {
                val payload = JSONObject().apply {
                    put("messageId", "test-webhook")
                    put("status", "TEST")
                    put("simSlot", 0)
                    put("timestamp", java.time.Instant.now().toString())
                }

                val request = Request.Builder()
                    .url(url)
                    .post(payload.toString().toRequestBody(JSON_MEDIA_TYPE))
                    .header("Content-Type", "application/json")
                    .build()

                val response = httpClient.newCall(request).execute()
                Pair(response.isSuccessful, response.code)
            } catch (e: Exception) {
                Pair(false, 0)
            }
        }
    }
}
