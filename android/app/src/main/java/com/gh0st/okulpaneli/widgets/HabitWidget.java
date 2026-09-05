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

/**
 * Homescreen widget — shows today's habits (build/quit) with streaks.
 *
 * Reads {@code widget-data.habits} from AuroraStorage, written by the JS
 * bridge in widgetSync.ts.
 */
public class HabitWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        String[] lines = new String[3];
        boolean found = false;
        for (int i = 0; i < 3; i++) lines[i] = "";

        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw != null) {
                JSONObject obj = new JSONObject(raw);
                JSONArray habits = obj.optJSONArray("habits");
                if (habits != null) {
                    int slot = 0;
                    for (int i = 0; i < habits.length() && slot < 3; i++) {
                        JSONObject h = habits.getJSONObject(i);
                        String title = h.optString("title", "?");
                        int streak = h.optInt("streak", 0);
                        String type = h.optString("type", "build");
                        String mark = type.equals("quit") ? "✕" : "•";
                        lines[slot] = mark + " " + title + "  ·  " + streak + "d";
                        slot++;
                        found = true;
                    }
                }
            }
        } catch (Exception ignored) {}

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit);
            views.setTextViewText(R.id.widget_habit_title, "Habits");
            views.setTextViewText(R.id.widget_habit_1, lines[0]);
            views.setTextViewText(R.id.widget_habit_2, lines[1]);
            views.setTextViewText(R.id.widget_habit_3, lines[2]);
            views.setTextViewText(R.id.widget_habit_empty, found ? "" : "Check in on your habits");
            views.setOnClickPendingIntent(R.id.widget_habit_root, openAppPendingIntent(context, "/habits"));
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
