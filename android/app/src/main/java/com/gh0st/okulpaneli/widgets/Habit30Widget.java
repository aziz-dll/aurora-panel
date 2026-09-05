package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.MainActivity;
import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * HabitKit 30-day widget: a single habit, 30 days as a 6×5 grid of
 * small filled/outlined cells. Cell color = habit color, filled = done,
 * empty stroke = missed, neutral = not-expected.
 *
 * Reads {@code widget-data.habit30} from AuroraStorage.
 */
public class Habit30Widget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int PER_ROW = 6;
    private static final int TOTAL_DAYS = 30;
    private static final int FALLBACK_COLOR = 0xFF2383E2;
    private static final int STREAK_COLOR = 0xFFF59E0B;
    private static final int SUB_COLOR = 0xFF9A9AA3;
    private static final int SKIP_FILL = 0xFF1B1B1F;
    private static final int SKIP_STROKE = 0xFF2A2A31;

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject obj = read(context);

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit30);
            views.setOnClickPendingIntent(R.id.widget_habit30_root, openAppPendingIntent(context, "/habits"));
            render(context, views, obj);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(Context context, RemoteViews views, JSONObject obj) {
        if (obj == null) {
            views.setViewVisibility(R.id.widget_habit30_grid, View.GONE);
            views.setViewVisibility(R.id.widget_habit30_empty, View.VISIBLE);
            views.setViewVisibility(R.id.widget_habit30_streak, View.GONE);
            views.setTextViewText(R.id.widget_habit30_name, "");
            views.setTextViewText(R.id.widget_habit30_meta, "");
            views.setTextViewText(R.id.widget_habit30_rate, "");
            return;
        }
        views.setViewVisibility(R.id.widget_habit30_grid, View.VISIBLE);
        views.setViewVisibility(R.id.widget_habit30_empty, View.GONE);

        JSONObject habit = obj.optJSONObject("habit");
        String name = habit != null ? habit.optString("title", "Habit") : "Habit";
        int color = FALLBACK_COLOR;
        if (habit != null) {
            try { color = Color.parseColor(habit.optString("color", "")); } catch (Exception ignored) {}
        }
        int streak = obj.optInt("streak", 0);
        int rate = obj.optInt("rate", 0);
        int expected = obj.optInt("totalExpected", 0);
        int done = obj.optInt("totalDone", 0);

        views.setTextViewText(R.id.widget_habit30_name, name);
        if (streak > 0) {
            views.setTextViewText(R.id.widget_habit30_streak, "🔥 " + streak);
            views.setTextColor(R.id.widget_habit30_streak, STREAK_COLOR);
            views.setViewVisibility(R.id.widget_habit30_streak, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_habit30_streak, View.GONE);
        }
        views.setInt(R.id.widget_habit30_dot, "setBackgroundColor", color);

        String meta;
        if (expected > 0) meta = done + " / " + expected + " days";
        else meta = "no expected days";
        views.setTextViewText(R.id.widget_habit30_meta, meta);
        views.setTextViewText(R.id.widget_habit30_rate, rate + "% · 30 days");

        // 30-day grid: 6 sütun × 5 satır, soldan sağa eski→yeni
        JSONArray days = obj.optJSONArray("days");
        views.removeAllViews(R.id.widget_habit30_grid);
        if (days == null) return;
        int n = Math.min(days.length(), TOTAL_DAYS);
        for (int row = 0; row < TOTAL_DAYS; row += PER_ROW) {
            RemoteViews rowV = new RemoteViews(context.getPackageName(), R.layout.widget_habit30_row);
            rowV.removeAllViews(R.id.widget_habit30_row);
            for (int c = 0; c < PER_ROW; c++) {
                int idx = row + c;
                RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_habit30_cell);
                if (idx < n) {
                    JSONObject d = days.optJSONObject(idx);
                    String status = d != null ? d.optString("status", "skip") : "skip";
                    String iso = d != null ? d.optString("iso", "") : "";
                    int fill;
                    int stroke;
                    switch (status) {
                        case "done":
                            fill = color;
                            stroke = color;
                            break;
                        case "slip":
                            fill = (color & 0x00FFFFFF) | 0x40000000; // %25 alpha
                            stroke = color;
                            break;
                        default:
                            fill = SKIP_FILL;
                            stroke = SKIP_STROKE;
                    }
                    // Inner cell rengi
                    cell.setInt(R.id.widget_habit30_cell, "setBackgroundColor", fill);
                    // Outer frame rengi (stroke)
                    cell.setInt(R.id.widget_habit30_cell_root, "setBackgroundColor", stroke);
                    cell.setContentDescription(R.id.widget_habit30_cell, status + " " + iso);
                } else {
                    cell.setViewVisibility(R.id.widget_habit30_cell_root, View.INVISIBLE);
                }
                rowV.addView(R.id.widget_habit30_row, cell);
            }
            views.addView(R.id.widget_habit30_grid, rowV);
        }
    }

    private static JSONObject read(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            return new JSONObject(raw).optJSONObject("habit30");
        } catch (Exception e) {
            return null;
        }
    }

    static PendingIntent openAppPendingIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse("aurora://app" + route));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, route.hashCode(), intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @SuppressWarnings("unused")
    private static String shortDate(String iso) {
        try {
            String[] p = iso.split("-");
            Calendar c = Calendar.getInstance();
            c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            return new SimpleDateFormat("d", Locale.US).format(c.getTime());
        } catch (Exception e) {
            return "";
        }
    }

    @SuppressWarnings("unused")
    private static String prettyDate(String iso) {
        try {
            String[] p = iso.split("-");
            Calendar c = Calendar.getInstance();
            c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            return new SimpleDateFormat("EEE d MMM", Locale.US).format(c.getTime());
        } catch (Exception e) {
            return iso;
        }
    }

    @SuppressWarnings("unused")
    private static Date parseDate(String iso) {
        try {
            String[] p = iso.split("-");
            Calendar c = Calendar.getInstance();
            c.clear();
            c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            return c.getTime();
        } catch (Exception e) {
            return new Date();
        }
    }
}
