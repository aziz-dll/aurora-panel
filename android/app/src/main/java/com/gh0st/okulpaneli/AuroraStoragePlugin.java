package com.gh0st.okulpaneli;

import android.app.AlarmManager;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.gh0st.okulpaneli.widgets.HabitWidget;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.gh0st.okulpaneli.widgets.BatteryWidget;
import com.gh0st.okulpaneli.widgets.ScheduleWidget;
import com.gh0st.okulpaneli.widgets.TodosWidget;
import com.gh0st.okulpaneli.widgets.ExamsWidget;
import com.gh0st.okulpaneli.widgets.QuickNoteWidget;
import com.gh0st.okulpaneli.widgets.Habit30Widget;

@CapacitorPlugin(name = "AuroraStorage")
public class AuroraStoragePlugin extends Plugin {

    private static final String PREFS = "aurora_storage";

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null) { call.reject("key required"); return; }
        prefs().edit().putString(key, value == null ? "" : value).apply();
        call.resolve();
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("key required"); return; }
        String value = prefs().getString(key, null);
        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("key required"); return; }
        prefs().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void keys(PluginCall call) {
        java.util.Set<String> all = prefs().getAll().keySet();
        JSArray keys = new JSArray();
        for (String k : all) keys.put(k);
        JSObject ret = new JSObject();
        ret.put("keys", keys);
        call.resolve(ret);
    }

    /**
     * Home-screen widget dokunuş kuyruğunu atomik boşalt: [{habitId, iso, at}]
     * döner ve kuyruk temizlenir. Loader 5 sn'lik poll ile çağırıp
     * postMessage ile panelin DB'sine işletir; panel widget-data'yı
     * yeniden yazınca widget yetkili duruma döner.
     */
    @PluginMethod
    public void drainHabitQueue(PluginCall call) {
        SharedPreferences sp = prefs();
        String raw = sp.getString("habit-toggle-queue", "[]");
        sp.edit().remove("habit-toggle-queue").apply();
        JSObject ret = new JSObject();
        try {
            ret.put("items", JSArray.from(raw));
        } catch (Exception e) {
            try { ret.put("items", JSArray.from("[]")); } catch (Exception ignored) {}
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void notifyWidgets(PluginCall call) {
        Context ctx = getContext();
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        if (mgr != null) {
            // En güvenilir yol: her provider'ın onUpdate() metodunu doğrudan
            // çağır. Broadcast yapsak bile Android 12+ exported=false
            // receiver'da implicit broadcast reddedebilir; doğrudan çağrı
            // sınırlamalardan etkilenmez.
            updateProvider(ctx, mgr, TodosWidget.class);
            updateProvider(ctx, mgr, BatteryWidget.class);
            updateProvider(ctx, mgr, ScheduleWidget.class);
            updateProvider(ctx, mgr, HabitWidget.class);
            updateProvider(ctx, mgr, ExamsWidget.class);
            updateProvider(ctx, mgr, QuickNoteWidget.class);
            updateProvider(ctx, mgr, Habit30Widget.class);
            updateProvider(ctx, mgr, com.gh0st.okulpaneli.widgets.HabitTodayWidget.class);
            updateProvider(ctx, mgr, com.gh0st.okulpaneli.widgets.HabitWeekWidget.class);
            updateProvider(ctx, mgr, com.gh0st.okulpaneli.widgets.HabitStatsWidget.class);
        }
        call.resolve();
    }

    private void updateProvider(Context ctx, AppWidgetManager mgr, Class<? extends android.appwidget.AppWidgetProvider> cls) {
        try {
            android.appwidget.AppWidgetProvider provider = cls.getDeclaredConstructor().newInstance();
            ComponentName name = new ComponentName(ctx, cls);
            int[] ids = mgr.getAppWidgetIds(name);
            if (ids != null && ids.length > 0) {
                provider.onUpdate(ctx, mgr, ids);
            }
        } catch (Exception ignored) {}
    }

    /* ── Notification reliability helpers ────────────────────────────────
       The APK schedules reminders with AlarmManager (exact alarms). On some
       devices the alarms never fire because 1) POST_NOTIFICATIONS is denied,
       2) the vendor's battery manager kills the app in deep sleep, or
       3) the "Alarms & reminders" special access was revoked. The loader
       polls these methods and surfaces a tap-to-fix toast instead of dying
       silently. */

    @PluginMethod
    public void canScheduleExact(PluginCall call) {
        boolean ok = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            ok = am != null && am.canScheduleExactAlarms();
        }
        JSObject ret = new JSObject();
        ret.put("value", ok);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("settings screen unavailable");
        }
    }

    @PluginMethod
    public void isBatteryOptimized(PluginCall call) {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        boolean optimized = pm != null
                && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        JSObject ret = new JSObject();
        ret.put("value", optimized);
        call.resolve(ret);
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("settings screen unavailable");
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("settings screen unavailable");
        }
    }
}
