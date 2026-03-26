package com.smsgateway.sms

import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * React Native bridge module for SMS and SIM operations.
 */
class SmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val simManager by lazy { SimManager(reactContext) }

    override fun getName(): String = "SmsModule"

    @ReactMethod
    fun getSimCards(promise: Promise) {
        try {
            val subs = simManager.getActiveSubscriptions()
            val result = Arguments.createArray()

            for (sub in subs) {
                val map = Arguments.createMap().apply {
                    putInt("slotIndex", sub.simSlotIndex + 1)
                    putInt("subscriptionId", sub.subscriptionId)
                    putString("carrierName", sub.carrierName?.toString() ?: "Unknown")
                    putString("phoneNumber", sub.number)
                    putBoolean("isActive", true)
                }
                result.pushMap(map)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SIM_ERROR", "Failed to get SIM cards: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getSimStats(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = Arguments.createArray()
                val subs = simManager.getActiveSubscriptions()

                for (sub in subs) {
                    val slot = sub.simSlotIndex + 1
                    val sent = simManager.getDailyCount(slot)
                    val map = Arguments.createMap().apply {
                        putInt("slotIndex", slot)
                        putInt("sentToday", sent)
                        putInt("dailyLimit", 700) // Default, overridden by settings
                    }
                    result.pushMap(map)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("SIM_STATS_ERROR", "Failed to get SIM stats: ${e.message}", e)
            }
        }
    }
}
