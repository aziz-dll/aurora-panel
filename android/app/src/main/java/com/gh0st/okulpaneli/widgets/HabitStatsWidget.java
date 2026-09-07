package com.gh0st.okulpaneli.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * HabitKit tarzı Stats widget (2x2): seçili alışkanlığın streak / 30g rate /
 * 30g done sayaçları büyük rakamlarla. Habit30 ile aynı slot mantığı —
 * header'ı Habit30'dan çevirince bu da değişir.
 */
public class HabitStatsWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String SLOT_PREFIX = Habit30Widget.SLOT_PREFIX;
    private static final int FALLBACK_COLOR = 0xFF2383E2;

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject obj = read(context);
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit_stats);
            views.setOnClickPendingIntent(R.id.widget_habit_stats_root, openAppPendingIntent(context, "/habits"));
            render(context, views, obj, id);
            mgr.updateAppWidget(id, views);
        }
    }

    @Override
    protected int crashSafeLayoutId() {
        return R.layout.widget_habit_stats;
    }

    private static void render(Context context, RemoteViews views, JSONObject obj, int widgetId) {
        JSONArray all = Habit30Widget.allHabits(obj);
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int slot = all != null ? sp.getInt(SLOT_PREFIX + widgetId, 0) : 0;
        if (all != null && slot < all.length()) {
            JSONObject entry = all.optJSONObject(slot);
            JSONObject habit = entry != null ? entry.optJSONObject("habit") : null;
            String name = habit != null ? habit.optString("title", "Habit") : "Habit";
            int color = FALLBACK_COLOR;
            if (habit != null) {
                try { color = Color.parseColor(habit.optString("color", "")); } catch (Exception ignored) {}
            }
            views.setTextViewText(R.id.widget_habit_stats_name, name);
            views.setInt(R.id.widget_habit_stats_dot, "setBackgroundColor", color);
            views.setTextViewText(R.id.widget_habit_stats_streak, String.valueOf(entry != null ? entry.optInt("streak", 0) : 0));
            views.setTextViewText(R.id.widget_habit_stats_rate, (entry != null ? entry.optInt("rate", 0) : 0) + "%");
            views.setTextViewText(R.id.widget_habit_stats_total, String.valueOf(entry != null ? entry.optInt("totalDone", 0) : 0));
        } else {
            views.setTextViewText(R.id.widget_habit_stats_name, "No habit");
            views.setTextViewText(R.id.widget_habit_stats_streak, "—");
            views.setTextViewText(R.id.widget_habit_stats_rate, "—");
            views.setTextViewText(R.id.widget_habit_stats_total, "—");
        }
    }

    private static JSONObject read(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString("widget-data", null);
            if (raw == null) return null;
            return new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }
}
