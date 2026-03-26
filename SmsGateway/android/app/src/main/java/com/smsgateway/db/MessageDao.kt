package com.smsgateway.db

import androidx.room.*

@Dao
interface MessageDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: MessageEntity)

    @Update
    suspend fun update(message: MessageEntity)

    @Query("SELECT * FROM messages WHERE id = :id")
    suspend fun getById(id: String): MessageEntity?

    @Query("SELECT * FROM messages ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getAll(limit: Int = 100, offset: Int = 0): List<MessageEntity>

    @Query("SELECT * FROM messages WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getByStatus(status: String, limit: Int = 100, offset: Int = 0): List<MessageEntity>

    @Query("SELECT * FROM messages WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1")
    suspend fun getNextQueued(): MessageEntity?

    @Query("SELECT * FROM messages WHERE status = 'FAILED' AND retry_count < max_retries AND (next_retry_at IS NULL OR next_retry_at <= :now) ORDER BY created_at ASC LIMIT 1")
    suspend fun getNextRetryable(now: Long = System.currentTimeMillis()): MessageEntity?

    @Query("DELETE FROM messages WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM messages WHERE status IN ('DELIVERED', 'FAILED')")
    suspend fun deleteCompleted()

    @Query("SELECT COUNT(*) FROM messages")
    suspend fun countTotal(): Int

    @Query("SELECT COUNT(*) FROM messages WHERE status = :status")
    suspend fun countByStatus(status: String): Int

    // Daily counts
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDailyCount(count: DailyCountEntity)

    @Query("SELECT * FROM daily_counts WHERE date = :date")
    suspend fun getDailyCount(date: String): DailyCountEntity?

    // Activity log
    @Insert
    suspend fun insertLog(log: ActivityLogEntity)

    @Query("SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT :limit")
    suspend fun getLogs(limit: Int = 200): List<ActivityLogEntity>

    @Query("DELETE FROM activity_log")
    suspend fun clearLogs()
}
