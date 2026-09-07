package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
 * Homescreen widget: open tasks with a priority dot and a due chip
 * (Overdue / Today / Tomorrow / weekday / date).
 *
 * Reads {@code widget-data.todos} from AuroraStorage (SharedPreferences-backed);
 * the data is written there by the JS bridge in widgetSync.ts.
 */
public class TodosWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int MAX_ROWS = 3;

    private static final int RED = 0xFFDC2626;
    private static final int AMBER = 0xFFD9730D;
    private static final int GREEN = 0xFF0F7B6C;
    private static final int GRAY = 0xFF9A9AA3;

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONArray todos = readTodos(context);
        int open = todos == null ? 0 : todos.length();

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_todos);
            views.setOnClickPendingIntent(R.id.widget_todos_root, openAppPendingIntent(context, "/todos"));
            render(context, views, todos, open);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(Context context, RemoteViews views, JSONArray todos, int open) {
        views.setTextViewText(R.id.widget_todos_title, "TASKS");
        views.setTextViewText(R.id.widget_todos_meta, open > 0 ? open + " open" : "");

        views.removeAllViews(R.id.widget_todos_list);
        if (open == 0) {
            views.setViewVisibility(R.id.widget_todos_list, View.GONE);
            views.setViewVisibility(R.id.widget_todos_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_todos_empty, "All done — open Aurora to sync");
            return;
        }

        views.setViewVisibility(R.id.widget_todos_list, View.VISIBLE);
        views.setViewVisibility(R.id.widget_todos_empty, View.GONE);

        int n = Math.min(open, MAX_ROWS);
        for (int i = 0; i < n; i++) {
            JSONObject t = todos.optJSONObject(i);
            if (t == null) continue;
            RemoteViews item = new RemoteViews(context.getPackageName(), R.layout.widget_todo_item);

            String title = t.optString("title", "");
            String due = t.optString("due", "");
            int accent = priorityColor(t.optString("priority", "med"));
            int dueDays = dueDaysFromToday(due);

            item.setTextViewText(R.id.widget_todo_title, title);
            item.setTextViewText(R.id.widget_todo_bullet, "●");
            item.setTextColor(R.id.widget_todo_bullet, accent);

            if (due.isEmpty()) {
                item.setTextViewText(R.id.widget_todo_due, "");
            } else {
                DueChip chip = dueChip(due, dueDays);
                item.setTextViewText(R.id.widget_todo_due, chip.text);
                item.setTextColor(R.id.widget_todo_due, chip.color);
            }
            views.addView(R.id.widget_todos_list, item);
        }
    }

    private static int priorityColor(String priority) {
        if ("high".equals(priority)) return RED;
        if ("low".equals(priority)) return GREEN;
        return AMBER;
    }

    static int dueDaysFromToday(String iso) {
        if (iso == null || iso.isEmpty()) return Integer.MAX_VALUE;
        try {
            String[] p = iso.split("-");
            Calendar due = Calendar.getInstance();
            due.clear();
            due.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            return (int) ((due.getTimeInMillis() - today.getTimeInMillis()) / 86_400_000L);
        } catch (Exception e) {
            return Integer.MAX_VALUE;
        }
    }

    static class DueChip {
        final String text;
        final int color;
        DueChip(String text, int color) { this.text = text; this.color = color; }
    }

    static DueChip dueChip(String due, int days) {
        if (days < 0) return new DueChip("Overdue", RED);
        if (days == 0) return new DueChip("Today", AMBER);
        if (days == 1) return new DueChip("Tomorrow", GRAY);
        if (days <= 6) {
            String wd = new SimpleDateFormat("EEE", Locale.US).format(parseISO(due));
            return new DueChip(wd, GRAY);
        }
        String md = new SimpleDateFormat("d MMM", Locale.US).format(parseISO(due));
        return new DueChip(md, GRAY);
    }

    private static Date parseISO(String iso) {
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

    private static JSONArray readTodos(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            return new JSONObject(raw).optJSONArray("todos");
        } catch (Exception e) {
            return null;
        }
    }

}
