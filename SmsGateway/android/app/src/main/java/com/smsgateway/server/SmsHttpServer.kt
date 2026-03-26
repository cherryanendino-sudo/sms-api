package com.smsgateway.server

import android.content.Context
import com.smsgateway.db.AppDatabase
import com.smsgateway.db.MessageEntity
import com.smsgateway.sms.SimManager
import fi.iki.elonen.NanoHTTPD
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.util.UUID

/**
 * Embedded HTTP server using NanoHTTPD.
 * Exposes REST endpoints for sending SMS messages and checking status.
 *
 * Endpoints:
 *   POST /send       - Queue a new SMS message
 *   GET  /status     - Get server and queue status
 *   GET  /messages/:id - Get status of a specific message
 */
class SmsHttpServer(
    private val context: Context,
    port: Int,
    private val auth: AuthMiddleware
) : NanoHTTPD(port) {

    private val startTime = System.currentTimeMillis()
    private val dao by lazy { AppDatabase.getInstance(context).messageDao() }
    private val simManager by lazy { SimManager(context) }

    override fun serve(session: IHTTPSession): Response {
        // Auth check for all endpoints
        if (!auth.isAuthorized(session.headers["authorization"])) {
            return jsonResponse(
                Response.Status.UNAUTHORIZED,
                errorJson("Unauthorized")
            )
        }

        val uri = session.uri.trimEnd('/')
        val method = session.method

        return try {
            when {
                method == Method.POST && uri == "/send" -> handleSend(session)
                method == Method.GET && uri == "/status" -> handleStatus()
                method == Method.GET && uri.startsWith("/messages/") -> {
                    val id = uri.removePrefix("/messages/")
                    handleGetMessage(id)
                }
                else -> jsonResponse(
                    Response.Status.NOT_FOUND,
                    errorJson("Not found")
                )
            }
        } catch (e: Exception) {
            jsonResponse(
                Response.Status.INTERNAL_ERROR,
                errorJson("Internal error: ${e.message}")
            )
        }
    }

    /**
     * POST /send
     * Body: { "phoneNumber": "...", "messageText": "...", "simSlot": 1|2 (optional) }
     */
    private fun handleSend(session: IHTTPSession): Response {
        val contentLength = session.headers["content-length"]?.toIntOrNull() ?: 0
        val body = ByteArray(contentLength)
        session.inputStream.read(body)
        val json = JSONObject(String(body))

        val phoneNumber = json.optString("phoneNumber", "").trim()
        val messageText = json.optString("messageText", "").trim()
        val simSlot = if (json.has("simSlot")) json.optInt("simSlot") else null

        // Validation
        if (phoneNumber.isEmpty()) {
            return jsonResponse(
                Response.Status.BAD_REQUEST,
                errorJson("phoneNumber is required")
            )
        }
        if (messageText.isEmpty()) {
            return jsonResponse(
                Response.Status.BAD_REQUEST,
                errorJson("messageText is required")
            )
        }
        if (simSlot != null && simSlot !in listOf(1, 2)) {
            return jsonResponse(
                Response.Status.BAD_REQUEST,
                errorJson("simSlot must be 1 or 2")
            )
        }

        // Check daily limit
        if (simSlot != null) {
            val limitReached = runBlocking {
                simManager.isDailyLimitReached(simSlot, 700)
            }
            if (limitReached) {
                return jsonResponse(
                    Response.Status.lookup(429) ?: Response.Status.FORBIDDEN,
                    errorJson("Daily limit reached for SIM $simSlot")
                )
            }
        }

        val messageId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()

        val entity = MessageEntity(
            id = messageId,
            phoneNumber = phoneNumber,
            messageText = messageText,
            status = "QUEUED",
            simSlot = simSlot,
            createdAt = now
        )

        runBlocking { dao.insert(entity) }

        val responseJson = JSONObject().apply {
            put("id", messageId)
            put("status", "QUEUED")
            put("createdAt", java.time.Instant.ofEpochMilli(now).toString())
        }

        return jsonResponse(Response.Status.ACCEPTED, responseJson.toString())
    }

    /**
     * GET /status
     */
    private fun handleStatus(): Response {
        val uptimeSeconds = ((System.currentTimeMillis() - startTime) / 1000).toInt()

        val stats = runBlocking {
            val queued = dao.countByStatus("QUEUED")
            val sent = dao.countByStatus("SENT")
            val delivered = dao.countByStatus("DELIVERED")
            val failed = dao.countByStatus("FAILED")
            mapOf("queued" to queued, "sent" to sent, "delivered" to delivered, "failed" to failed)
        }

        val sims = simManager.getActiveSubscriptions().map { sub ->
            val slot = sub.simSlotIndex + 1
            val sentToday = runBlocking { simManager.getDailyCount(slot) }
            JSONObject().apply {
                put("slot", slot)
                put("carrier", sub.carrierName?.toString() ?: "Unknown")
                put("sentToday", sentToday)
                put("dailyLimit", 700)
                put("active", true)
            }
        }

        val responseJson = JSONObject().apply {
            put("server", JSONObject().apply {
                put("running", true)
                put("uptime", uptimeSeconds)
                put("port", listeningPort)
            })
            put("sims", org.json.JSONArray(sims))
            put("queue", JSONObject().apply {
                put("queued", stats["queued"])
                put("sent", stats["sent"])
                put("delivered", stats["delivered"])
                put("failed", stats["failed"])
            })
        }

        return jsonResponse(Response.Status.OK, responseJson.toString())
    }

    /**
     * GET /messages/:id
     */
    private fun handleGetMessage(id: String): Response {
        val message = runBlocking { dao.getById(id) }
            ?: return jsonResponse(
                Response.Status.NOT_FOUND,
                errorJson("Message not found")
            )

        val responseJson = JSONObject().apply {
            put("id", message.id)
            put("phoneNumber", message.phoneNumber)
            put("messageText", message.messageText)
            put("status", message.status)
            put("simSlot", message.usedSimSlot ?: message.simSlot)
            put("retryCount", message.retryCount)
            put("createdAt", java.time.Instant.ofEpochMilli(message.createdAt).toString())
            if (message.sentAt != null) {
                put("sentAt", java.time.Instant.ofEpochMilli(message.sentAt).toString())
            }
            if (message.deliveredAt != null) {
                put("deliveredAt", java.time.Instant.ofEpochMilli(message.deliveredAt).toString())
            }
            if (message.errorCode != null) {
                put("errorCode", message.errorCode)
            }
        }

        return jsonResponse(Response.Status.OK, responseJson.toString())
    }

    private fun jsonResponse(status: Response.Status, body: String): Response {
        return newFixedLengthResponse(status, "application/json", body)
    }

    private fun errorJson(message: String): String {
        return JSONObject().put("error", message).toString()
    }
}
