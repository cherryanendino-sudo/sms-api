package com.smsgateway.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "phone_number")
    val phoneNumber: String,

    @ColumnInfo(name = "message_text")
    val messageText: String,

    val status: String = "QUEUED", // QUEUED, SENDING, SENT, DELIVERED, FAILED

    @ColumnInfo(name = "sim_slot")
    val simSlot: Int? = null, // Requested SIM slot (1 or 2)

    @ColumnInfo(name = "used_sim_slot")
    val usedSimSlot: Int? = null, // Actual SIM slot used

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,

    @ColumnInfo(name = "max_retries")
    val maxRetries: Int = 20,

    @ColumnInfo(name = "error_code")
    val errorCode: String? = null,

    @ColumnInfo(name = "webhook_sent")
    val webhookSent: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sent_at")
    val sentAt: Long? = null,

    @ColumnInfo(name = "delivered_at")
    val deliveredAt: Long? = null,

    @ColumnInfo(name = "next_retry_at")
    val nextRetryAt: Long? = null
)
