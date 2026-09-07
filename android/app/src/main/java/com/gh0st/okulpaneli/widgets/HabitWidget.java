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

/**
 * HabitKit-style homescreen widget: one colored circle per habit with the
 * streak count below. Circle is filled + white check when done today, an
 * outlined ring with the habit's icon emoji otherwise.
 *
 * Reads {@code widget-data.habits} from AuroraStorage (written by
 * widgetSync.ts via the loader bridge).
 */
public class HabitWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int PER_ROW = 3;
    private static final int MAX_HABITS = 6;
    private static final int FALLBACK_COLOR = 0xFF2383E2;
    private static final int TEXT_COLOR = 0xFFF59E0B;   // streak flame
    private static final int SUB_TEXT_COLOR = 0xFF9A9AA3; // zero streak

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONArray habits = readHabits(context);

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit);
            views.setOnClickPendingIntent(R.id.widget_habit_root, openAppPendingIntent(context, "/habits"));
            render(context, views, habits);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(Context context, RemoteViews views, JSONArray habits) {
        views.setTextViewText(R.id.widget_habit_title, "HABITS");

        int n = habits == null ? 0 : Math.min(habits.length(), MAX_HABITS);
        if (n == 0) {
            views.removeAllViews(R.id.widget_habit_grid);
            views.setViewVisibility(R.id.widget_habit_grid, View.GONE);
            views.setViewVisibility(R.id.widget_habit_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_habit_empty, "No habits due today — open Aurora");
            views.setTextViewText(R.id.widget_habit_meta, "");
            return;
        }

        views.setViewVisibility(R.id.widget_habit_grid, View.VISIBLE);
        views.setViewVisibility(R.id.widget_habit_empty, View.GONE);
        views.removeAllViews(R.id.widget_habit_grid);

        int doneCount = 0;
        for (int rowStart = 0; rowStart < n; rowStart += PER_ROW) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_habit_row);
            row.removeAllViews(R.id.widget_habit_row);
            for (int c = 0; c < PER_ROW; c++) {
                int i = rowStart + c;
                RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_habit_cell);
                JSONObject h = i < n ? habits.optJSONObject(i) : null;
                if (h != null) {
                    if (h.optBoolean("done", false)) doneCount++;
                    bindCell(context, cell, h);
                } else {
                    // keep grid aligned: invisible filler cell
                    cell.setViewVisibility(R.id.widget_habit_cell_root, View.INVISIBLE);
                }
                row.addView(R.id.widget_habit_row, cell);
            }
            views.addView(R.id.widget_habit_grid, row);
        }

        views.setTextViewText(R.id.widget_habit_meta, doneCount + "/" + n);
    }

    private static void bindCell(Context context, RemoteViews cell, JSONObject h) {
        cell.setViewVisibility(R.id.widget_habit_cell_root, View.VISIBLE);
        cell.setOnClickPendingIntent(R.id.widget_habit_cell_root, openAppPendingIntent(context, "/habits"));

        int streak = h.optInt("streak", 0);
        boolean done = h.optBoolean("done", false);
        int color = FALLBACK_COLOR;
        try {
            color = Color.parseColor(h.optString("color", ""));
        } catch (IllegalArgumentException ignored) {}

        // Circle: filled + white check when done, outlined ring otherwise
        cell.setInt(R.id.widget_habit_dot, "setImageResource",
                done ? R.drawable.widget_habit_fill : R.drawable.widget_habit_ring);
        cell.setInt(R.id.widget_habit_dot, "setColorFilter", color);
        cell.setViewVisibility(R.id.widget_habit_check, done ? View.VISIBLE : View.GONE);
        cell.setViewVisibility(R.id.widget_habit_emoji, done ? View.GONE : View.VISIBLE);
        cell.setTextViewText(R.id.widget_habit_emoji, iconEmoji(h.optString("icon", "")));

        // Streak badge under the circle
        if (streak > 0) {
            cell.setTextViewText(R.id.widget_habit_streak, "🔥 " + streak);
            cell.setTextColor(R.id.widget_habit_streak, TEXT_COLOR);
        } else {
            cell.setTextViewText(R.id.widget_habit_streak, "0");
            cell.setTextColor(R.id.widget_habit_streak, SUB_TEXT_COLOR);
        }
    }

    private static final String ICON_EMOJIS = "dumbbell=💪,drop=💧,book=📖,flame=🔥,target=🎯,"
            + "activity=📈,sun=☀️,moon=🌙,clock=⏰,heart=❤️,star=⭐,checkSquare=☑️,"
            + "listChecks=📋,archive=📦,stickyNote=📝,repeat=🔁,trendingUp=📊,zap=⚡,"
            + "gauge=⏱️,cpu=🧠";

    static String iconEmoji(String icon) {
        if (icon.isEmpty()) return "✅";
        for (String pair : ICON_EMOJIS.split(",")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(icon)) return pair.substring(eq + 1);
        }
        return "✅";
    }

    private static JSONArray readHabits(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            return new JSONObject(raw).optJSONArray("habits");
        } catch (Exception e) {
            return null;
        }
    }

}
