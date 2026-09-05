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

import java.util.Calendar;

/**
 * Homescreen widget: today's lessons (max 4) with lesson-colored times and a
 * "now" marker on the class in progress.
 *
 * Reads lessons from {@code widget-data.lessons}; day-of-week convention is
 * Monday=0 ... Sunday=6, matching the app.
 */
public class ScheduleWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int MAX_ROWS = 4;
    private static final int FALLBACK_COLOR = 0xFF2383E2;
    private static final int NOW_COLOR = 0xFF16A34A;

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        int todayDow = (Calendar.getInstance().get(Calendar.DAY_OF_WEEK) + 5) % 7; // Mon=0..Sun=6
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = sp.getString(KEY, null);

        JSONArray today = new JSONArray();
        if (raw != null) {
            try {
                JSONArray lessons = new JSONObject(raw).optJSONArray("lessons");
                if (lessons != null) {
                    for (int i = 0; i < lessons.length(); i++) {
                        JSONObject l = lessons.optJSONObject(i);
                        if (l != null && l.optInt("day", -1) == todayDow) today.put(l);
                    }
                }
            } catch (Exception ignored) {}
        }

        Calendar now = Calendar.getInstance();
        int minutesNow = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_schedule);
            views.setOnClickPendingIntent(R.id.widget_schedule_root, openAppPendingIntent(context, "/schedule"));
            render(context, views, today, minutesNow);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(Context context, RemoteViews views, JSONArray lessons, int minutesNow) {
        views.setTextViewText(R.id.widget_schedule_title, "TODAY");
        views.setTextViewText(R.id.widget_schedule_meta, lessons.length() > 0 ? lessons.length() + " classes" : "");

        views.removeAllViews(R.id.widget_schedule_list);
        if (lessons.length() == 0) {
            views.setViewVisibility(R.id.widget_schedule_list, View.GONE);
            views.setViewVisibility(R.id.widget_schedule_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_schedule_empty, "No classes today — open Aurora to sync");
            return;
        }

        views.setViewVisibility(R.id.widget_schedule_list, View.VISIBLE);
        views.setViewVisibility(R.id.widget_schedule_empty, View.GONE);

        int n = Math.min(lessons.length(), MAX_ROWS);
        for (int i = 0; i < n; i++) {
            JSONObject l = lessons.optJSONObject(i);
            if (l == null) continue;
            RemoteViews item = new RemoteViews(context.getPackageName(), R.layout.widget_lesson_item);

            String start = l.optString("start", "");
            String end = l.optString("end", "");
            String name = l.optString("name", "?");
            String room = l.optString("room", "");

            int accent = FALLBACK_COLOR;
            try {
                accent = Color.parseColor(l.optString("color", ""));
            } catch (IllegalArgumentException ignored) {}

            boolean isNow = inRange(start, end, minutesNow);
            item.setTextViewText(R.id.widget_lesson_time, (isNow ? "▶ " : "") + start + "–" + end);
            item.setTextColor(R.id.widget_lesson_time, isNow ? NOW_COLOR : accent);
            item.setTextViewText(R.id.widget_lesson_name, name);
            item.setTextViewText(R.id.widget_lesson_room, room.isEmpty() ? "" : room);
            views.addView(R.id.widget_schedule_list, item);
        }
    }

    private static boolean inRange(String start, String end, int minutesNow) {
        int s = toMinutes(start), e = toMinutes(end);
        return s >= 0 && e > 0 && minutesNow >= s && minutesNow < e;
    }

    private static int toMinutes(String hhmm) {
        String[] p = hhmm.split(":");
        if (p.length != 2) return -1;
        try {
            return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
        } catch (NumberFormatException e) {
            return -1;
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
}
