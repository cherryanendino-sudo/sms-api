package com.smsgateway.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_counts")
data class DailyCountEntity(
    @PrimaryKey
    val date: String, // YYYY-MM-DD

    @ColumnInfo(name = "sim1_count")
    val sim1Count: Int = 0,

    @ColumnInfo(name = "sim2_count")
    val sim2Count: Int = 0
)
