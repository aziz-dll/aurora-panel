package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.AuroraWidgetActionReceiver;
import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * HabitKit tarzı "Today" widget: bugün yapılacak alışkanlıklar, her satır
 * tıklanabilir (tap → bugünü toggle). Satır içi check dairesi: bekleyen =
 * habit renginde çerçeve, tamamlanan = habit renginde dolu daire.
 *
 * Veri: widget-data.habits [{id,title,streak,rate,color,icon,done}] + today.
 * Tap: AuroraWidgetActionReceiver broadcast → kuyruk (iso=today) → panel DB.
 * Satır adedi yüksekliğe göre sığdırılır (resize 4x2 dahil).
 */
public class HabitTodayWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int FALLBACK_COLOR = 0xFF2383E2;

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject obj = read(context);
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit_today);
            views.setOnClickPendingIntent(R.id.widget_habit_today_root, openAppPendingIntent(context, "/habits"));
            render(context, views, obj, id);
            mgr.updateAppWidget(id, views);
        }
    }

    @Override
    protected int crashSafeLayoutId() {
        return R.layout.widget_habit_today;
    }

    /** Yeniden boyutlandırmada satır adedini yeni yüksekliğe göre sığdır. */
    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager mgr,
                                          int appWidgetId, android.os.Bundle newOptions) {
        try {
            JSONObject obj = read(context);
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit_today);
            views.setOnClickPendingIntent(R.id.widget_habit_today_root, openAppPendingIntent(context, "/habits"));
            render(context, views, obj, appWidgetId);
            mgr.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.w("AuroraWidgets", "HabitToday resize render failed", e);
        }
    }

    private static void render(Context context, RemoteViews views, JSONObject obj, int widgetId) {
        JSONArray habits = obj != null ? obj.optJSONArray("habits") : null;
        String today = obj != null ? obj.optString("today", "") : "";

        if (obj == null || habits == null || habits.length() == 0) {
            views.setViewVisibility(R.id.widget_habit_today_list, View.GONE);
            views.setViewVisibility(R.id.widget_habit_today_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_habit_today_progress, "");
            return;
        }
        views.setViewVisibility(R.id.widget_habit_today_list, View.VISIBLE);
        views.setViewVisibility(R.id.widget_habit_today_empty, View.GONE);

        int done = 0;
        for (int i = 0; i < habits.length(); i++) {
            JSONObject h = habits.optJSONObject(i);
            if (h != null && h.optBoolean("done", false)) done++;
        }
        views.setTextViewText(R.id.widget_habit_today_progress, done + "/" + habits.length());

        // Satır yüksekliği ≈ 30dp + header; resize'da sığan kadar göster
        int dpHeight = 0;
        try {
            android.os.Bundle opts = AppWidgetManager.getInstance(context)
                    .getAppWidgetOptions(widgetId);
            dpHeight = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT);
        } catch (Exception ignored) {}
        int maxRows = dpHeight > 0 ? Math.max(1, Math.min(habits.length(), (dpHeight - 42) / 30))
                : habits.length();

        views.removeAllViews(R.id.widget_habit_today_list);
        for (int i = 0; i < Math.min(habits.length(), maxRows); i++) {
            JSONObject h = habits.optJSONObject(i);
            if (h == null) continue;

            String title = h.optString("title", "Habit");
            boolean isDone = h.optBoolean("done", false);
            int streak = h.optInt("streak", 0);
            int color = FALLBACK_COLOR;
            try { color = Color.parseColor(h.optString("color", "")); } catch (Exception ignored) {}

            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_habit_today_row);
            row.setTextViewText(R.id.widget_habit_today_name, title);
            row.setTextColor(R.id.widget_habit_today_name,
                    isDone ? 0xFF9A9AA3 : androidx.core.content.ContextCompat.getColor(context, R.color.widget_text));
            row.setTextViewText(R.id.widget_habit_today_streak, streak > 0 ? "🔥 " + streak : "");

            if (isDone) {
                row.setViewVisibility(R.id.widget_habit_today_check_ring, View.GONE);
                row.setViewVisibility(R.id.widget_habit_today_check_fill, View.VISIBLE);
                row.setInt(R.id.widget_habit_today_check_fill, "setBackgroundColor", color);
            } else {
                row.setViewVisibility(R.id.widget_habit_today_check_ring, View.VISIBLE);
                row.setViewVisibility(R.id.widget_habit_today_check_fill, View.GONE);
                row.setInt(R.id.widget_habit_today_check_ring, "setBackgroundColor", color & 0x00FFFFFF);
            }

            // INTERAKTİF: satıra dokun → bugünü toggle.
            // requestCode bandı Habit30 ile ÇAKIŞMASIN: filterEquals extras'ları
            // karşılaştırmaz, aynı bandı paylaşırsak birbirinin PI'sını ezer.
            String habitId = h.optString("id", "");
            if (!habitId.isEmpty() && !today.isEmpty()) {
                android.content.Intent toggle = AuroraWidgetActionReceiver.toggleIntent(context, habitId, today);
                PendingIntent pi = PendingIntent.getBroadcast(
                        context, 100_000 + (widgetId % 1000) * 20 + i,
                        toggle,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                row.setOnClickPendingIntent(R.id.widget_habit_today_row, pi);
            }
            views.addView(R.id.widget_habit_today_list, row);
        }
    }

    private static JSONObject read(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            return new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }
}
