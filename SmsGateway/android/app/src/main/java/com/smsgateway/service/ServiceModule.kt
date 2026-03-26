package com.smsgateway.service

import com.facebook.react.bridge.*

/**
 * React Native bridge module for managing the foreground service.
 */
class ServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ServiceModule"

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            GatewayForegroundService.start(reactApplicationContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            GatewayForegroundService.stop(reactApplicationContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            promise.resolve(GatewayForegroundService.isServiceRunning())
        } catch (e: Exception) {
            promise.reject("SERVICE_STATUS_ERROR", e.message, e)
        }
    }
}
