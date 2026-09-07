package com.gh0st.okulpaneli.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * HabitKit tarzı Week widget: tek alışkanlığın son 7 günü, gün başına bir
 * dikey çubuk (done = tam yükseklik, slip = yarım + alfa, skip = nokta) ve
 * altında gün harfi (M T W T F S S).
 *
 * Veri: widget-data.habit30all'dan son 7 gün (aynı çoklu-instance slot
 * mantığı: Habit30 ile aynı slot pref'ini kullanır — iki widget birlikte
 * aynı alışkanlığı gösterir; header'ı Habit30'dan çevirmek yeterli).
 */
public class HabitWeekWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String SLOT_PREFIX = Habit30Widget.SLOT_PREFIX;
    private static final int DAYS = 7;
    private static final int FALLBACK_COLOR = 0xFF2383E2;
    private static final String[] DAY_LETTERS = {"M", "T", "W", "T", "F", "S", "S"};

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject obj = read(context);
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit_week);
            views.setOnClickPendingIntent(R.id.widget_habit_week_root, openAppPendingIntent(context, "/habits"));
            render(context, views, obj, id);
            mgr.updateAppWidget(id, views);
        }
    }

    @Override
    protected int crashSafeLayoutId() {
        return R.layout.widget_habit_week;
    }

    private static void render(Context context, RemoteViews views, JSONObject obj, int widgetId) {
        JSONArray all = Habit30Widget.allHabits(obj);
        JSONObject entry = all != null ? pickEntry(context, widgetId, all) : null;

        if (entry == null) {
            views.setViewVisibility(R.id.widget_habit_week_bars, View.GONE);
            views.setViewVisibility(R.id.widget_habit_week_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_habit_week_name, "");
            views.setTextViewText(R.id.widget_habit_week_streak, "");
            return;
        }
        views.setViewVisibility(R.id.widget_habit_week_bars, View.VISIBLE);
        views.setViewVisibility(R.id.widget_habit_week_empty, View.GONE);

        JSONObject habit = entry.optJSONObject("habit");
        String name = habit != null ? habit.optString("title", "Habit") : "Habit";
        int color = FALLBACK_COLOR;
        if (habit != null) {
            try { color = Color.parseColor(habit.optString("color", "")); } catch (Exception ignored) {}
        }
        int streak = entry.optInt("streak", 0);

        views.setTextViewText(R.id.widget_habit_week_name, name);
        views.setInt(R.id.widget_habit_week_dot, "setBackgroundColor", color);
        views.setTextViewText(R.id.widget_habit_week_streak, streak > 0 ? "🔥 " + streak : "");

        JSONArray days = entry.optJSONArray("days");
        views.removeAllViews(R.id.widget_habit_week_bars);
        if (days == null || days.length() == 0) return;

        // Son 7 gün (dizinin sonu en yeni)
        int start = Math.max(0, days.length() - DAYS);
        for (int i = start; i < days.length(); i++) {
            JSONObject d = days.optJSONObject(i);
            RemoteViews col = new RemoteViews(context.getPackageName(), R.layout.widget_habit_week_col);
            String status = d != null ? d.optString("status", "skip") : "skip";

            col.setViewVisibility(R.id.widget_habit_week_bar_done, View.GONE);
            col.setViewVisibility(R.id.widget_habit_week_bar_slip, View.GONE);
            col.setViewVisibility(R.id.widget_habit_week_bar_skip, View.GONE);

            switch (status) {
                case "done":
                    col.setViewVisibility(R.id.widget_habit_week_bar_done, View.VISIBLE);
                    col.setInt(R.id.widget_habit_week_bar_done, "setBackgroundColor", color);
                    break;
                case "slip":
                    col.setViewVisibility(R.id.widget_habit_week_bar_slip, View.VISIBLE);
                    col.setInt(R.id.widget_habit_week_bar_slip, "setBackgroundColor",
                            (color & 0x00FFFFFF) | 0x40000000);
                    break;
                default:
                    col.setViewVisibility(R.id.widget_habit_week_bar_skip, View.VISIBLE);
                    col.setInt(R.id.widget_habit_week_bar_skip, "setBackgroundColor",
                            androidx.core.content.ContextCompat.getColor(context, R.color.widget_habit30_skip_stroke));
            }

            // Gün harfi: ISO'nun haftanın günü (Mon=0)
            String iso = d != null ? d.optString("iso", "") : "";
            String letter = "";
            try {
                String[] p = iso.split("-");
                Calendar c = Calendar.getInstance();
                c.clear();
                c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
                int dow = (c.get(Calendar.DAY_OF_WEEK) + 5) % 7;
                letter = DAY_LETTERS[dow];
            } catch (Exception ignored) {}
            col.setTextViewText(R.id.widget_habit_week_day, letter);

            views.addView(R.id.widget_habit_week_bars, col);
        }
    }

    private static JSONObject pickEntry(Context context, int widgetId, JSONArray all) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int slot = sp.getInt(SLOT_PREFIX + widgetId, 0);
        if (slot >= all.length()) slot = 0;
        return all.optJSONObject(slot);
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
