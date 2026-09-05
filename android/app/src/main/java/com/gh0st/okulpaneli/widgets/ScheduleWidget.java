package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.MainActivity;
import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Homescreen widget: shows today's lessons (max 3).
 *
 * Reads lessons from {@code widget-data.lessons} and filters by today's
 * day-of-week (Monday=0 ... Sunday=6, matching the app's convention).
 */
public class ScheduleWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        int todayDow = (Calendar.getInstance().get(Calendar.DAY_OF_WEEK) + 5) % 7; // Mon=0..Sun=6
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = sp.getString(KEY, null);

        String[] lines = new String[3];
        boolean found = false;
        for (int i = 0; i < 3; i++) lines[i] = "";

        if (raw != null) {
            try {
                JSONObject obj = new JSONObject(raw);
                JSONArray lessons = obj.optJSONArray("lessons");
                if (lessons != null) {
                    int slot = 0;
                    for (int i = 0; i < lessons.length() && slot < 3; i++) {
                        JSONObject l = lessons.getJSONObject(i);
                        if (l.optInt("day", -1) != todayDow) continue;
                        String name = l.optString("name", "?");
                        String start = l.optString("start", "");
                        String end = l.optString("end", "");
                        String room = l.optString("room", "");
                        lines[slot] = "• " + start + "–" + end + "  " + name + (room.isEmpty() ? "" : "  (" + room + ")");
                        slot++;
                        found = true;
                    }
                }
            } catch (Exception ignored) {}
        }

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_schedule);
            views.setTextViewText(R.id.widget_schedule_title, "Today");
            views.setTextViewText(R.id.widget_schedule_1, lines[0]);
            views.setTextViewText(R.id.widget_schedule_2, lines[1]);
            views.setTextViewText(R.id.widget_schedule_3, lines[2]);
            views.setTextViewText(R.id.widget_schedule_empty, found ? "" : "No classes today");
            views.setOnClickPendingIntent(R.id.widget_schedule_root, openAppPendingIntent(context, "/schedule"));
            mgr.updateAppWidget(id, views);
        }
    }

    static PendingIntent openAppPendingIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse("aurora://app" + route));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, route.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE);
    }
}