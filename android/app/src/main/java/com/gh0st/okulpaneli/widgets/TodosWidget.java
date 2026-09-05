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
 * Homescreen widget: shows the top 3 open todos.
 *
 * Reads {@code widget-data} from AuroraStorage (SharedPreferences-backed).
 * AuroraStorage is keyed under the "aurora_storage" SharedPreferences
 * file; the data is written there by the JS bridge in widgetSync.ts.
 */
public class TodosWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        WidgetData data = readData(context);
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_todos);
            views.setTextViewText(R.id.widget_todos_title, "Tasks");
            views.setTextViewText(R.id.widget_todos_1, "");
            views.setTextViewText(R.id.widget_todos_2, "");
            views.setTextViewText(R.id.widget_todos_3, "");
            if (data != null && data.todos != null) {
                int n = Math.min(3, data.todos.length);
                if (n >= 1) views.setTextViewText(R.id.widget_todos_1, "• " + data.todos[0].title);
                if (n >= 2) views.setTextViewText(R.id.widget_todos_2, "• " + data.todos[1].title);
                if (n >= 3) views.setTextViewText(R.id.widget_todos_3, "• " + data.todos[2].title);
                if (n == 0) views.setTextViewText(R.id.widget_todos_empty, "No open tasks");
                else views.setTextViewText(R.id.widget_todos_empty, "");
            } else {
                views.setTextViewText(R.id.widget_todos_empty, "Open Aurora to sync");
            }
            views.setOnClickPendingIntent(R.id.widget_todos_root, openAppPendingIntent(context, "/todos"));
            mgr.updateAppWidget(id, views);
        }
    }

    static WidgetData readData(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            JSONObject obj = new JSONObject(raw);
            JSONArray arr = obj.optJSONArray("todos");
            WidgetData d = new WidgetData();
            if (arr != null) {
                d.todos = new WidgetTodo[arr.length()];
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject t = arr.getJSONObject(i);
                    d.todos[i] = new WidgetTodo(
                        t.optString("title", ""),
                        t.optString("due", null));
                }
            }
            return d;
        } catch (Exception e) {
            return null;
        }
    }

    static PendingIntent openAppPendingIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse("aurora://app" + route));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, route.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE);
    }

    static class WidgetData {
        WidgetTodo[] todos;
    }
    static class WidgetTodo {
        String title;
        String due;
        WidgetTodo(String title, String due) { this.title = title; this.due = due; }
    }
}