package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.AuroraWidgetActionReceiver;
import com.gh0st.okulpaneli.R;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * HabitKit tarzı 30-day widget: tek bir alışkanlığın son 30 günü, resize'a
 * göre dinamik grid (3x2 → 5 kolon, 4x2 → 6-7 kolon). done = habit renginde
 * dolu, slip = %25 alfa, skip = nötr gri.
 *
 * ÇOKLU INSTANCE: birden fazla 30D widget eklendiğinde her biri FARKLI
 * alışkanlığı gösterebilir — header'daki isme dokununca sıradaki alışkanlığa
 * geçer (slot, appWidgetId bazlı pref'te tutulur; panel DB'sine dokunmaz).
 * Grid hücrelerine dokunmak günü toggle eder (kuyruk → panel DB).
 *
 * Veri: widget-data.habit30all — tüm aktif habitler için {habit, days, rate,
 * streak, totalExpected, totalDone}; yoksa eski tekil habit30 alanına düşer.
 */
public class Habit30Widget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String QUEUE_KEY = AuroraWidgetActionReceiver.QUEUE_KEY;
    static final String SLOT_PREFIX = "habit30-slot-";
    private static final int TOTAL_DAYS = 30;
    private static final int FALLBACK_COLOR = 0xFF2383E2;
    private static final int STREAK_COLOR = 0xFFF59E0B;

    private static int skipFill(Context ctx) {
        return androidx.core.content.ContextCompat.getColor(ctx, R.color.widget_habit30_skip_fill);
    }

    private static int skipStroke(Context ctx) {
        return androidx.core.content.ContextCompat.getColor(ctx, R.color.widget_habit30_skip_stroke);
    }

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject obj = read(context);
        JSONArray queue = readQueue(context);

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit30);
            views.setOnClickPendingIntent(R.id.widget_habit30_root, openAppPendingIntent(context, "/habits"));
            // Header (isim) dokunuşu → sıradaki alışkanlığa geç
            views.setOnClickPendingIntent(R.id.widget_habit30_name,
                    Habit30CycleReceiver.cyclePendingIntent(context, id));
            render(context, views, obj, queue, id, colsFor(context, mgr, id));
            mgr.updateAppWidget(id, views);
        }
    }

    @Override
    protected int crashSafeLayoutId() {
        return R.layout.widget_habit30;
    }

    /** Resize'da grid'i yeni genişliğe göre yeniden doldur. */
    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager mgr,
                                          int appWidgetId, android.os.Bundle newOptions) {
        try {
            JSONObject obj = read(context);
            JSONArray queue = readQueue(context);
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit30);
            views.setOnClickPendingIntent(R.id.widget_habit30_root, openAppPendingIntent(context, "/habits"));
            views.setOnClickPendingIntent(R.id.widget_habit30_name,
                    Habit30CycleReceiver.cyclePendingIntent(context, appWidgetId));
            render(context, views, obj, queue, appWidgetId, colsFor(context, mgr, appWidgetId));
            mgr.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.w("AuroraWidgets", "Habit30 resize render failed", e);
        }
    }

    /** Widget genişliğinden sütun sayısı: ~70dp başına 1 kolon, 5..10 arası. */
    private static int colsFor(Context context, AppWidgetManager mgr, int appWidgetId) {
        try {
            android.os.Bundle opts = mgr.getAppWidgetOptions(appWidgetId);
            int dpWidth = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH);
            int cells = Math.max(2, dpWidth / 70);
            return Math.max(5, Math.min(10, cells));
        } catch (Exception e) {
            return 6;
        }
    }

    /** Bu widget hangi alışkanlığı göstersin? (slot pref'i; yoksa streak en yüksek olan) */
    static JSONObject pickHabit(Context context, int widgetId, JSONArray all) {
        if (all == null || all.length() == 0) return null;
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int slot = sp.getInt(SLOT_PREFIX + widgetId, 0);
        if (slot >= all.length()) slot = 0;
        return all.optJSONObject(slot);
    }

    /** render'da kullanılan habit listesi: habit30all varsa o, yoksa tekil habit30. */
    static JSONArray allHabits(JSONObject widgetData) {
        if (widgetData == null) return null;
        JSONArray all = widgetData.optJSONArray("habit30all");
        if (all != null && all.length() > 0) return all;
        JSONObject single = widgetData.optJSONObject("habit30");
        if (single != null) {
            JSONArray arr = new JSONArray();
            arr.put(single);
            return arr;
        }
        return null;
    }

    private static void render(Context context, RemoteViews views, JSONObject obj, JSONArray queue,
                               int widgetId, int cols) {
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

        JSONArray all = allHabits(obj);
        JSONObject entry = pickHabit(context, widgetId, all);
        if (entry == null) {
            views.setViewVisibility(R.id.widget_habit30_grid, View.GONE);
            views.setViewVisibility(R.id.widget_habit30_empty, View.VISIBLE);
            views.setViewVisibility(R.id.widget_habit30_streak, View.GONE);
            views.setTextViewText(R.id.widget_habit30_name, "");
            views.setTextViewText(R.id.widget_habit30_meta, "");
            views.setTextViewText(R.id.widget_habit30_rate, "");
            return;
        }

        JSONObject habit = entry.optJSONObject("habit");
        String name = habit != null ? habit.optString("title", "Habit") : "Habit";
        String habitId = habit != null ? habit.optString("id", "") : "";
        int color = FALLBACK_COLOR;
        if (habit != null) {
            try { color = Color.parseColor(habit.optString("color", "")); } catch (Exception ignored) {}
        }

        views.setTextViewText(R.id.widget_habit30_name, name + " ▸");
        views.setTextColor(R.id.widget_habit30_name,
                androidx.core.content.ContextCompat.getColor(context, R.color.widget_text));
        views.setInt(R.id.widget_habit30_dot, "setBackgroundColor", color);

        JSONArray days = entry.optJSONArray("days");
        if (days != null) {
            // Optimistic: kuyruktaki toggle'ları duruma uygula (done↔slip; skip dokunulmaz).
            // SADECE kuyruk bu habit için değişiklik yaptıysa yeniden hesapla —
            // aksi halde snapshot'ın yetkili streak/rate'i sessizce ezilirdi.
            boolean changed = applyQueue(days, queue, habitId);
            if (changed) recompute(entry, days);
        }

        int streak = entry.optInt("streak", 0);
        int rate = entry.optInt("rate", 0);
        int expected = entry.optInt("totalExpected", 0);
        int done = entry.optInt("totalDone", 0);

        if (streak > 0) {
            views.setTextViewText(R.id.widget_habit30_streak, "🔥 " + streak);
            views.setTextColor(R.id.widget_habit30_streak, STREAK_COLOR);
            views.setViewVisibility(R.id.widget_habit30_streak, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_habit30_streak, View.GONE);
        }

        String meta = expected > 0 ? done + " / " + expected + " days" : "no expected days";
        views.setTextViewText(R.id.widget_habit30_meta, meta);
        views.setTextViewText(R.id.widget_habit30_rate, rate + "% · 30d · tap day");

        views.removeAllViews(R.id.widget_habit30_grid);
        if (days == null) return;
        // Dinamik grid: perRow sütun, soldan sağa eski→yeni; son 30 gün gösterilir
        int perRow = Math.max(5, Math.min(10, cols));
        int startIdx = Math.max(0, days.length() - TOTAL_DAYS);
        int n = days.length();
        RemoteViews[] rowsCache = new RemoteViews[(TOTAL_DAYS + perRow - 1) / perRow];
        int rowCount = 0;
        for (int rowStart = startIdx; rowStart < n && rowCount < rowsCache.length; rowStart += perRow) {
            RemoteViews rowV = new RemoteViews(context.getPackageName(), R.layout.widget_habit30_row);
            rowV.removeAllViews(R.id.widget_habit30_row);
            int cellsInRow = Math.min(perRow, n - rowStart);
            for (int c = 0; c < perRow; c++) {
                int idx = rowStart + c;
                RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_habit30_cell);
                if (c < cellsInRow) {
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
                            fill = skipFill(context);
                            stroke = skipStroke(context);
                    }
                    cell.setInt(R.id.widget_habit30_cell, "setBackgroundColor", fill);
                    cell.setInt(R.id.widget_habit30_cell_root, "setBackgroundColor", stroke);
                    cell.setContentDescription(R.id.widget_habit30_cell, status + " " + iso);

                    // INTERAKTİF: güne dokun → broadcast → kuyruk → panel DB.
                    // requestCode bandı HabitToday (100000+) ve cycle (200000+) ile ÇAKIŞMASIN.
                    if (!habitId.isEmpty() && !iso.isEmpty()) {
                        Intent toggle = AuroraWidgetActionReceiver.toggleIntent(context, habitId, iso);
                        PendingIntent pi = PendingIntent.getBroadcast(
                                context,
                                (widgetId % 100) * 100 + idx,
                                toggle,
                                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                        cell.setOnClickPendingIntent(R.id.widget_habit30_cell_root, pi);
                    }
                } else {
                    cell.setViewVisibility(R.id.widget_habit30_cell_root, View.INVISIBLE);
                }
                rowV.addView(R.id.widget_habit30_row, cell);
            }
            views.addView(R.id.widget_habit30_grid, rowV);
            rowCount++;
        }
    }

    /** Kuyruktaki toggle'ları gün dizisine uygula: done↔slip (skip'e dokunma).
     *  @return gerçekten bir hücre değişti mi */
    private static boolean applyQueue(JSONArray days, JSONArray queue, String habitId) {
        boolean changed = false;
        if (queue == null || days == null || habitId == null || habitId.isEmpty()) return false;
        for (int q = 0; q < queue.length(); q++) {
            JSONObject tap = queue.optJSONObject(q);
            if (tap == null || !habitId.equals(tap.optString("habitId"))) continue;
            String iso = tap.optString("iso", "");
            for (int i = 0; i < days.length(); i++) {
                JSONObject d = days.optJSONObject(i);
                if (d != null && iso.equals(d.optString("iso"))) {
                    String status = d.optString("status", "skip");
                    try {
                        if (status.equals("done")) { d.put("status", "slip"); changed = true; }
                        else if (status.equals("slip")) { d.put("status", "done"); changed = true; }
                    } catch (org.json.JSONException ignored) {}
                    break;
                }
            }
        }
        return changed;
    }

    /** Optimistic durumdan totalDone/totalExpected/rate/streak yeniden hesapla.
     *  Streak kuralı TS habitStreak ile aynı: SON gün (bugün) beklenen gün değilse 0. */
    private static void recompute(JSONObject entry, JSONArray days) {
        int expected = 0, done = 0;
        for (int i = 0; i < days.length(); i++) {
            JSONObject d = days.optJSONObject(i);
            if (d == null) continue;
            String status = d.optString("status", "skip");
            if (!status.equals("skip")) expected++;
            if (status.equals("done")) done++;
        }
        try {
            entry.put("totalExpected", expected);
            entry.put("totalDone", done);
            entry.put("rate", expected == 0 ? 0 : Math.round(done * 100f / expected));

            JSONObject last = days.optJSONObject(days.length() - 1);
            if (last == null || "skip".equals(last.optString("status", "skip"))) {
                entry.put("streak", 0);
                return;
            }
            int streak = 0;
            for (int i = days.length() - 1; i >= 0; i--) {
                JSONObject d = days.optJSONObject(i);
                if (d == null) continue;
                String status = d.optString("status", "skip");
                if (status.equals("skip")) continue;
                if (status.equals("done")) streak++;
                else break;
            }
            entry.put("streak", streak);
        } catch (org.json.JSONException ignored) {}
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

    private static JSONArray readQueue(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            return new JSONArray(sp.getString(QUEUE_KEY, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }
}
