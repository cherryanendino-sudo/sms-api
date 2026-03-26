package com.smsgateway.sms

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsManager

/**
 * Dispatches SMS messages via the Android SmsManager API.
 * Supports dual-SIM by using subscription-aware SmsManager instances.
 */
class SmsDispatcher(private val context: Context) {

    companion object {
        const val ACTION_SMS_SENT = "com.smsgateway.SMS_SENT"
        const val ACTION_SMS_DELIVERED = "com.smsgateway.SMS_DELIVERED"
        const val EXTRA_MESSAGE_ID = "message_id"
    }

    /**
     * Send an SMS message.
     *
     * @param messageId Unique ID for tracking
     * @param phoneNumber Recipient phone number
     * @param messageText SMS body text
     * @param subscriptionId The SIM subscription ID to use (from SubscriptionManager)
     */
    fun sendSms(
        messageId: String,
        phoneNumber: String,
        messageText: String,
        subscriptionId: Int?
    ) {
        val smsManager = if (subscriptionId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(SmsManager::class.java)
                .createForSubscriptionId(subscriptionId)
        } else if (subscriptionId != null) {
            @Suppress("DEPRECATION")
            SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }

        val sentIntent = PendingIntent.getBroadcast(
            context,
            messageId.hashCode(),
            Intent(ACTION_SMS_SENT).apply {
                putExtra(EXTRA_MESSAGE_ID, messageId)
                setPackage(context.packageName)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val deliveredIntent = PendingIntent.getBroadcast(
            context,
            messageId.hashCode() + 1,
            Intent(ACTION_SMS_DELIVERED).apply {
                putExtra(EXTRA_MESSAGE_ID, messageId)
                setPackage(context.packageName)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Handle multi-part messages
        val parts = smsManager.divideMessage(messageText)
        if (parts.size > 1) {
            val sentIntents = ArrayList<PendingIntent>(parts.size)
            val deliveredIntents = ArrayList<PendingIntent>(parts.size)
            for (i in parts.indices) {
                sentIntents.add(sentIntent)
                deliveredIntents.add(deliveredIntent)
            }
            smsManager.sendMultipartTextMessage(
                phoneNumber,
                null,
                parts,
                sentIntents,
                deliveredIntents
            )
        } else {
            smsManager.sendTextMessage(
                phoneNumber,
                null,
                messageText,
                sentIntent,
                deliveredIntent
            )
        }
    }
}
