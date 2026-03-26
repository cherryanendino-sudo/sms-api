package com.smsgateway.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "activity_log")
data class ActivityLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val timestamp: Long = System.currentTimeMillis(),

    val level: String = "INFO", // INFO, WARN, ERROR

    val message: String,

    @ColumnInfo(name = "message_id")
    val messageId: String? = null
)
