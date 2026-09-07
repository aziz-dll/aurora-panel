package com.gh0st.okulpaneli.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Habit30 widget header'ına (alışkanlık adına) dokunulduğunda o widget
 * instance'ının gösterdiği alışkanlığı sıradakine çevirir. Slot, appWidgetId
 * bazlı SharedPreferences'ta tutulur — panel DB'sine dokunmaz.
 */
public class Habit30CycleReceiver extends BroadcastReceiver {

    public static final String ACTION_CYCLE = "com.gh0st.okulpaneli.HABIT30_CYCLE";
    public static final String SLOT_PREFIX = "habit30-slot-";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION_CYCLE.equals(intent.getAction())) return;
        int widgetId = intent.getIntExtra("widgetId", -1);
        if (widgetId < 0) return;

        try {
            SharedPreferences sp = ctx.getSharedPreferences("aurora_storage", Context.MODE_PRIVATE);
            String raw = sp.getString("widget-data", null);
            if (raw == null) return;
            JSONArray all = Habit30Widget.allHabits(new JSONObject(raw));
            if (all == null || all.length() == 0) return;

            String key = SLOT_PREFIX + widgetId;
            int slot = sp.getInt(key, 0);
            sp.edit().putInt(key, (slot + 1) % all.length()).apply();
        } catch (Exception ignored) {
            return;
        }

        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            if (mgr != null) {
                ComponentName name = new ComponentName(ctx, Habit30Widget.class);
                int[] ids = mgr.getAppWidgetIds(name);
                if (ids != null && ids.length > 0) {
                    new Habit30Widget().onUpdate(ctx, mgr, ids);
                }
            }
        } catch (Exception ignored) {}
    }

    static PendingIntent cyclePendingIntent(Context context, int appWidgetId) {
        Intent i = new Intent(context, Habit30CycleReceiver.class);
        i.setAction(ACTION_CYCLE);
        i.putExtra("widgetId", appWidgetId);
        return PendingIntent.getBroadcast(
                context, 200_000 + appWidgetId, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
