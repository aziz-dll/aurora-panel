package com.gh0st.okulpaneli;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.gh0st.okulpaneli.widgets.Habit30Widget;
import com.gh0st.okulpaneli.widgets.HabitTodayWidget;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget etkileşim alıcısı. Habit widget'larındaki bir güne/satıra
 * dokunulduğunda (RemoteViews setOnClickPendingIntent → broadcast) çalışır.
 *
 * Akış:
 *  1) {habitId, iso} kuyruğa yazılır (aurora_storage / habit-toggle-queue)
 *  2) İlgili widget'lar optimistic olarak yeniden çizilir (kuyruk uygulanır)
 *  3) Loader 5 sn'lik poll ile kuyruğu boşaltır ve panelin DB'sine işletir;
 *     panel widget-data'yı yeniden yazınca widget yetkili durumla çizilir.
 * Uygulama kapalıyken de çalışır — kuyruk kalıcıdır (son 50 kayıt saklanır).
 */
public class AuroraWidgetActionReceiver extends BroadcastReceiver {

    public static final String ACTION_TOGGLE_HABIT = "com.gh0st.okulpaneli.WIDGET_TOGGLE_HABIT";
    public static final String PREFS = "aurora_storage";
    public static final String QUEUE_KEY = "habit-toggle-queue";
    private static final int QUEUE_CAP = 50;

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION_TOGGLE_HABIT.equals(intent.getAction())) return;
        String habitId = intent.getStringExtra("habitId");
        String iso = intent.getStringExtra("iso");
        if (habitId == null || habitId.isEmpty() || iso == null || iso.isEmpty()) return;

        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray queue;
            try {
                queue = new JSONArray(sp.getString(QUEUE_KEY, "[]"));
            } catch (Exception parseFail) {
                queue = new JSONArray(); // bozuk kuyruk → sıfırdan başla
            }
            JSONObject item = new JSONObject();
            item.put("habitId", habitId);
            item.put("iso", iso);
            item.put("at", System.currentTimeMillis());
            queue.put(item);
            // Kuyruk sonsuz büyümesin: son QUEUE_CAP kaydı tut
            while (queue.length() > QUEUE_CAP) {
                JSONArray next = new JSONArray();
                for (int i = queue.length() - QUEUE_CAP; i < queue.length(); i++) {
                    next.put(queue.optJSONObject(i));
                }
                queue = next;
            }
            sp.edit().putString(QUEUE_KEY, queue.toString()).apply();
        } catch (Exception ignored) {
            return;
        }

        // Widget'ları optimistic durumla tazele (kuyruğu Habit30/HabitToday uygular)
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            if (mgr != null) {
                refresh(ctx, mgr, Habit30Widget.class);
                refresh(ctx, mgr, HabitTodayWidget.class);
            }
        } catch (Exception ignored) {}
    }

    private static void refresh(Context ctx, AppWidgetManager mgr, Class<?> cls) {
        try {
            ComponentName name = new ComponentName(ctx, cls);
            int[] ids = mgr.getAppWidgetIds(name);
            if (ids != null && ids.length > 0) {
                cls.getDeclaredConstructor().newInstance();
                android.appwidget.AppWidgetProvider provider =
                        (android.appwidget.AppWidgetProvider) cls.getDeclaredConstructor().newInstance();
                provider.onUpdate(ctx, mgr, ids);
            }
        } catch (Exception ignored) {}
    }

    public static Intent toggleIntent(Context ctx, String habitId, String iso) {
        Intent i = new Intent(ctx, AuroraWidgetActionReceiver.class);
        i.setAction(ACTION_TOGGLE_HABIT);
        i.putExtra("habitId", habitId);
        i.putExtra("iso", iso);
        return i;
    }
}
