package com.gh0st.okulpaneli;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
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

    @PluginMethod
    public void notifyWidgets(PluginCall call) {
        Context ctx = getContext();
        // Widget'lara gerçekten onUpdate gönder — notifyAppWidgetViewDataChanged
        // RemoteViews (statik text) kullanan widget'larda görünmüyor.


        broadcastUpdate(ctx, TodosWidget.class);
        broadcastUpdate(ctx, BatteryWidget.class);
        broadcastUpdate(ctx, ScheduleWidget.class);
        broadcastUpdate(ctx, HabitWidget.class);
        call.resolve();
    }

    private void broadcastUpdate(Context ctx, Class<?> cls) {
        try {
            ComponentName name = new ComponentName(ctx, cls);
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            int[] ids = mgr.getAppWidgetIds(name);
            if (ids != null && ids.length > 0) {
                android.content.Intent intent = new android.content.Intent(ctx, cls);
                intent.setAction(android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                intent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                ctx.sendBroadcast(intent);
            }
        } catch (Exception ignored) {}
    }
}