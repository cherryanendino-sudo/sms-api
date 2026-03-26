package com.smsgateway

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.smsgateway.db.DatabaseModule
import com.smsgateway.queue.QueueModule
import com.smsgateway.server.ServerModule
import com.smsgateway.service.ServiceModule
import com.smsgateway.sms.SmsModule
import com.smsgateway.webhook.WebhookModule

/**
 * React Native package that registers all native modules for the SMS Gateway.
 */
class SmsGatewayPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            ServerModule(reactContext),
            SmsModule(reactContext),
            QueueModule(reactContext),
            DatabaseModule(reactContext),
            ServiceModule(reactContext),
            WebhookModule(reactContext)
        )
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
