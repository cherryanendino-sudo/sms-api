package com.smsgateway.server

import android.net.wifi.WifiManager
import android.content.Context
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.Inet4Address
import java.net.NetworkInterface

/**
 * React Native bridge module for the embedded HTTP server.
 */
class ServerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var server: SmsHttpServer? = null
    private var auth: AuthMiddleware? = null
    private var startTime: Long = 0

    override fun getName(): String = "ServerModule"

    @ReactMethod
    fun startServer(port: Int, apiKey: String, promise: Promise) {
        try {
            if (server?.isAlive == true) {
                promise.reject("SERVER_RUNNING", "Server is already running")
                return
            }

            auth = AuthMiddleware(apiKey)
            server = SmsHttpServer(reactApplicationContext, port, auth!!).also {
                it.start()
            }
            startTime = System.currentTimeMillis()

            sendEvent("onServerStatusChanged", Arguments.createMap().apply {
                putBoolean("running", true)
            })

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVER_START_ERROR", "Failed to start server: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopServer(promise: Promise) {
        try {
            server?.stop()
            server = null

            sendEvent("onServerStatusChanged", Arguments.createMap().apply {
                putBoolean("running", false)
            })

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVER_STOP_ERROR", "Failed to stop server: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getServerStatus(promise: Promise) {
        try {
            val isRunning = server?.isAlive == true
            val uptimeSeconds = if (isRunning) {
                ((System.currentTimeMillis() - startTime) / 1000).toInt()
            } else 0

            val result = Arguments.createMap().apply {
                putBoolean("running", isRunning)
                putInt("port", server?.listeningPort ?: 0)
                putString("ipAddress", getDeviceIpAddress())
                putInt("uptime", uptimeSeconds)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", "Failed to get server status: ${e.message}", e)
        }
    }

    private fun getDeviceIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                if (networkInterface.isLoopback || !networkInterface.isUp) continue

                val addresses = networkInterface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (addr is Inet4Address && !addr.isLoopbackAddress) {
                        return addr.hostAddress ?: "0.0.0.0"
                    }
                }
            }
        } catch (_: Exception) {}
        return "0.0.0.0"
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
