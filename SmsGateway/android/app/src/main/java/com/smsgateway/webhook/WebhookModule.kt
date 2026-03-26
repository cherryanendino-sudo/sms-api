package com.smsgateway.webhook

import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * React Native bridge module for webhook configuration and testing.
 */
class WebhookModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val webhookClient by lazy { WebhookClient(reactContext) }

    override fun getName(): String = "WebhookModule"

    @ReactMethod
    fun setWebhookUrl(url: String, promise: Promise) {
        try {
            webhookClient.setWebhookUrl(url)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WEBHOOK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getWebhookUrl(promise: Promise) {
        try {
            promise.resolve(webhookClient.getWebhookUrl())
        } catch (e: Exception) {
            promise.reject("WEBHOOK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun testWebhook(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val (success, statusCode) = webhookClient.testWebhook()
                val result = Arguments.createMap().apply {
                    putBoolean("success", success)
                    putInt("statusCode", statusCode)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("WEBHOOK_TEST_ERROR", e.message, e)
            }
        }
    }
}
