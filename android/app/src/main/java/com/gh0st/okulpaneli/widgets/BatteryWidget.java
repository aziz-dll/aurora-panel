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
 * Homescreen widget: shows server battery %, RAM usage, and storage %.
 *
 * Reads server stats from {@code widget-data} (server.battery, .memory, .disk)
 * in AuroraStorage.
 */
public class BatteryWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = sp.getString(KEY, null);

        String batteryText = "—%";
        String ramText = "RAM —";
        String storageText = "Storage —";

        if (raw != null) {
            try {
                JSONObject obj = new JSONObject(raw);
                JSONObject server = obj.optJSONObject("server");
                if (server != null) {
                    JSONObject battery = server.optJSONObject("battery");
                    if (battery != null && !battery.isNull("percent")) {
                        int pct = battery.optInt("percent", -1);
                        if (pct >= 0) {
                            boolean charging = battery.optBoolean("charging", false);
                            batteryText = pct + "%" + (charging ? "  ·  charging" : "");
                        }
                    }
                    JSONObject memory = server.optJSONObject("memory");
                    if (memory != null) {
                        int total = memory.optInt("total", 0);
                        int used = memory.optInt("used", 0);
                        if (total > 0) {
                            int pct = (int) Math.round((double) used / total * 100);
                            ramText = "RAM " + pct + "%";
                        }
                    }
                    JSONArray disk = server.optJSONArray("disk");
                    if (disk != null) {
                        for (int i = 0; i < disk.length(); i++) {
                            JSONObject d = disk.getJSONObject(i);
                            String mount = d.optString("mount", "");
                            if (mount.equals("/") || mount.equals("/data")) {
                                double total = d.optDouble("total", 0);
                                double used = d.optDouble("used", 0);
                                if (total > 0) {
                                    int pct = (int) Math.round(used / total * 100);
                                    storageText = "Storage " + pct + "%";
                                }
                                break;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_battery);
            views.setTextViewText(R.id.widget_battery_title, "Server");
            views.setTextViewText(R.id.widget_battery_pct, batteryText);
            views.setTextViewText(R.id.widget_battery_ram, ramText);
            views.setTextViewText(R.id.widget_battery_storage, storageText);
            views.setOnClickPendingIntent(R.id.widget_battery_root, openAppPendingIntent(context, "/server"));
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