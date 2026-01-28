package com.yourapp.couplestatus.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import android.graphics.Color
import org.json.JSONObject
import java.util.Date
import java.util.concurrent.TimeUnit

/**
 * 커플 상태 홈 화면 위젯 Provider
 */
class CoupleStatusWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "CoupleStatusWidgetPrefs"
        const val PARTNER_STATUS_KEY = "partnerStatus"
        const val ACTION_REFRESH = "com.yourapp.couplestatus.REFRESH_WIDGET"

        // 상태별 이모지
        val STATUS_EMOJI = mapOf(
            "available" to "😊",
            "busy" to "😰",
            "studying" to "📚",
            "working" to "💻",
            "sleeping" to "😴",
            "eating" to "🍽️",
            "exercising" to "🏃",
            "custom" to "✨"
        )

        // 상태별 라벨
        val STATUS_LABEL = mapOf(
            "available" to "여유있음",
            "busy" to "바쁨",
            "studying" to "공부중",
            "working" to "일하는중",
            "sleeping" to "자는중",
            "eating" to "밥먹는중",
            "exercising" to "운동중",
            "custom" to "직접입력"
        )

        // 상태별 배경색
        val STATUS_COLOR = mapOf(
            "available" to Color.parseColor("#86EFAC"),
            "busy" to Color.parseColor("#FDBA74"),
            "studying" to Color.parseColor("#93C5FD"),
            "working" to Color.parseColor("#C4B5FD"),
            "sleeping" to Color.parseColor("#A5B4FC"),
            "eating" to Color.parseColor("#FDE047"),
            "exercising" to Color.parseColor("#FCA5A5"),
            "custom" to Color.parseColor("#F9A8D4")
        )

        /**
         * 위젯 수동 갱신 호출
         */
        fun refreshWidget(context: Context) {
            val intent = Intent(context, CoupleStatusWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(
                    android.content.ComponentName(context, CoupleStatusWidgetProvider::class.java)
                )
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds)
            }
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (intent.action == ACTION_REFRESH) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, CoupleStatusWidgetProvider::class.java)
            )
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // SharedPreferences에서 파트너 상태 로드
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val partnerStatus = loadPartnerStatus(prefs)

        // RemoteViews 생성 (레이아웃 리소스 ID 필요)
        val views = RemoteViews(context.packageName, R.layout.widget_couple_status)

        // 캐릭터 이모지 설정
        val characterEmoji = if (partnerStatus.characterType == "male") "👨" else "👩"
        views.setTextViewText(R.id.text_character, characterEmoji)

        // 상태 이모지 설정
        val statusEmoji = STATUS_EMOJI[partnerStatus.status] ?: "😊"
        views.setTextViewText(R.id.text_status_emoji, statusEmoji)

        // 이름 설정
        views.setTextViewText(R.id.text_name, partnerStatus.name)

        // 상태 라벨 설정
        val statusLabel = STATUS_LABEL[partnerStatus.status] ?: partnerStatus.status
        views.setTextViewText(R.id.text_status, statusLabel)

        // 커스텀 메시지 설정
        if (partnerStatus.customMessage.isNotEmpty()) {
            views.setTextViewText(R.id.text_message, "\"${partnerStatus.customMessage}\"")
            views.setViewVisibility(R.id.text_message, android.view.View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.text_message, android.view.View.GONE)
        }

        // 마지막 업데이트 시간 설정
        val timeAgo = getTimeAgoString(partnerStatus.updatedAt)
        views.setTextViewText(R.id.text_updated, timeAgo)

        // 배경색 설정
        val bgColor = STATUS_COLOR[partnerStatus.status] ?: Color.LTGRAY
        views.setInt(R.id.widget_container, "setBackgroundColor", bgColor)

        // 앱 실행 Intent 설정
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val pendingIntent = android.app.PendingIntent.getActivity(
                context, 0, launchIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        }

        // 위젯 업데이트
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun loadPartnerStatus(prefs: SharedPreferences): PartnerStatus {
        val json = prefs.getString(PARTNER_STATUS_KEY, null)

        return if (json != null) {
            try {
                val obj = JSONObject(json)
                PartnerStatus(
                    name = obj.optString("name", "파트너"),
                    status = obj.optString("status", "available"),
                    emotion = obj.optString("emotion", "neutral"),
                    customMessage = obj.optString("customMessage", ""),
                    characterType = obj.optString("characterType", "female"),
                    updatedAt = obj.optLong("updatedAt", System.currentTimeMillis())
                )
            } catch (e: Exception) {
                PartnerStatus.placeholder()
            }
        } else {
            PartnerStatus.placeholder()
        }
    }

    private fun getTimeAgoString(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp

        return when {
            diff < TimeUnit.MINUTES.toMillis(1) -> "방금 전"
            diff < TimeUnit.HOURS.toMillis(1) -> "${TimeUnit.MILLISECONDS.toMinutes(diff)}분 전"
            diff < TimeUnit.DAYS.toMillis(1) -> "${TimeUnit.MILLISECONDS.toHours(diff)}시간 전"
            else -> "${TimeUnit.MILLISECONDS.toDays(diff)}일 전"
        }
    }
}

/**
 * 파트너 상태 데이터 클래스
 */
data class PartnerStatus(
    val name: String,
    val status: String,
    val emotion: String,
    val customMessage: String,
    val characterType: String,
    val updatedAt: Long
) {
    companion object {
        fun placeholder() = PartnerStatus(
            name = "파트너",
            status = "available",
            emotion = "neutral",
            customMessage = "",
            characterType = "female",
            updatedAt = System.currentTimeMillis()
        )
    }
}
