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

import java.util.Locale;

/**
 * Homescreen widget: J7 server battery % (color-coded), RAM usage, and
 * storage % — reads server stats from {@code widget-data.server} in
 * AuroraStorage.
 */
public class BatteryWidget extends AuroraWidgetBase {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    private static final int GREEN = 0xFF16A34A;
    private static final int AMBER = 0xFFD97706;
    private static final int RED = 0xFFDC2626;

    @Override
    protected void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = sp.getString(KEY, null);

        String batteryText = "—%";
        boolean charging = false;
        boolean hasBattery = false;
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
                            hasBattery = true;
                            charging = battery.optBoolean("charging", false);
                            batteryText = pct + "%";
                        }
                    }
                    JSONObject memory = server.optJSONObject("memory");
                    if (memory != null) {
                        double total = memory.optDouble("total", 0);
                        double used = memory.optDouble("used", 0);
                        if (total > 0) {
                            int pct = (int) Math.round(used / total * 100);
                            ramText = String.format(Locale.US, "RAM %d%% · %.1f / %.1f GB",
                                    pct, used / 1024.0, total / 1024.0);
                        }
                    }
                    JSONArray disk = server.optJSONArray("disk");
                    if (disk != null) {
                        for (int i = 0; i < disk.length(); i++) {
                            JSONObject d = disk.optJSONObject(i);
                            if (d == null) continue;
                            String mount = d.optString("mount", "");
                            if (mount.equals("/") || mount.equals("/data")) {
                                double total = d.optDouble("total", 0);
                                double used = d.optDouble("used", 0);
                                if (total > 0) {
                                    int pct = (int) Math.round(used / total * 100);
                                    storageText = "Storage " + pct + "% used";
                                }
                                break;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        int pct = -1;
        try {
            pct = Integer.parseInt(batteryText.replace("%", ""));
        } catch (NumberFormatException ignored) {}
        int level = pct < 0 ? GRAY : pct <= 25 ? RED : pct <= 50 ? AMBER : GREEN;

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_battery);
            views.setOnClickPendingIntent(R.id.widget_battery_root, openAppPendingIntent(context, "/server"));
            views.setTextViewText(R.id.widget_battery_title, "SERVER");
            views.setTextViewText(R.id.widget_battery_pct, batteryText);
            views.setTextColor(R.id.widget_battery_pct, level);
            views.setTextViewText(R.id.widget_battery_ram, ramText);
            views.setTextViewText(R.id.widget_battery_storage, storageText);
            views.setViewVisibility(R.id.widget_battery_charging,
                    charging ? View.VISIBLE : View.GONE);
            if (hasBattery && !charging) {
                views.setTextViewText(R.id.widget_battery_storage,
                        storageText + "  ·  not charging");
            }
            mgr.updateAppWidget(id, views);
        }
    }

    private static final int GRAY = 0xFF9A9AA3;

}
