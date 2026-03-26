package com.smsgateway.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences

/**
 * BroadcastReceiver that starts the GatewayForegroundService on device boot.
 * Only starts the service if auto-start is enabled in settings.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val PREFS_NAME = "sms_gateway_boot"
        private const val KEY_AUTO_START = "auto_start_on_boot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val autoStart = prefs.getBoolean(KEY_AUTO_START, true)

        if (autoStart) {
            GatewayForegroundService.start(context)
        }
    }
}
