package com.smsgateway.sms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager
import com.smsgateway.db.AppDatabase
import com.smsgateway.webhook.WebhookClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * BroadcastReceiver that handles SMS sent and delivery confirmation intents.
 * Updates the message status in the database and triggers webhook delivery.
 */
class DeliveryReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val messageId = intent.getStringExtra(SmsDispatcher.EXTRA_MESSAGE_ID) ?: return
        val dao = AppDatabase.getInstance(context).messageDao()

        CoroutineScope(Dispatchers.IO).launch {
            val message = dao.getById(messageId) ?: return@launch

            when (intent.action) {
                SmsDispatcher.ACTION_SMS_SENT -> handleSentResult(context, dao, message, resultCode, messageId)
                SmsDispatcher.ACTION_SMS_DELIVERED -> handleDeliveredResult(context, dao, message, resultCode, messageId)
            }
        }
    }

    private suspend fun handleSentResult(
        context: Context,
        dao: com.smsgateway.db.MessageDao,
        message: com.smsgateway.db.MessageEntity,
        resultCode: Int,
        messageId: String
    ) {
        when (resultCode) {
            Activity.RESULT_OK -> {
                dao.update(
                    message.copy(
                        status = "SENT",
                        sentAt = System.currentTimeMillis()
                    )
                )
            }
            else -> {
                val errorCode = when (resultCode) {
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "GENERIC_FAILURE"
                    SmsManager.RESULT_ERROR_NO_SERVICE -> "NO_SERVICE"
                    SmsManager.RESULT_ERROR_NULL_PDU -> "NULL_PDU"
                    SmsManager.RESULT_ERROR_RADIO_OFF -> "RADIO_OFF"
                    else -> "UNKNOWN_ERROR_$resultCode"
                }
                dao.update(
                    message.copy(
                        status = "FAILED",
                        errorCode = errorCode
                    )
                )
            }
        }
    }

    private suspend fun handleDeliveredResult(
        context: Context,
        dao: com.smsgateway.db.MessageDao,
        message: com.smsgateway.db.MessageEntity,
        resultCode: Int,
        messageId: String
    ) {
        when (resultCode) {
            Activity.RESULT_OK -> {
                val now = System.currentTimeMillis()
                dao.update(
                    message.copy(
                        status = "DELIVERED",
                        deliveredAt = now
                    )
                )

                // Fire webhook
                val webhookClient = WebhookClient(context)
                webhookClient.sendDeliveryStatus(
                    messageId = messageId,
                    status = "DELIVERED",
                    simSlot = message.usedSimSlot ?: 0,
                    deliveredAt = now
                )

                // Mark webhook sent
                dao.update(
                    message.copy(
                        status = "DELIVERED",
                        deliveredAt = now,
                        webhookSent = true
                    )
                )
            }
        }
    }
}
