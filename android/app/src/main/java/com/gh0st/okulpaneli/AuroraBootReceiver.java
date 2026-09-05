package com.gh0st.okulpaneli;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.Calendar;
import java.util.Map;

/**
 * Cihaz yeniden başladığında daha önce planlanmış günlük alarmları yeniden kur.
 * Tek seferlik alarmlar (oneShot) kurtarılmaz — sadece everyDay modu kalıcıdır.
 */
public class AuroraBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !"android.intent.action.QUICKBOOT_POWERON".equals(action)
                && !"android.intent.action.MY_PACKAGE_REPLACED".equals(action)
                && !"android.intent.action.LOCKED_BOOT_COMPLETED".equals(action)) {
            return;
        }
        SharedPreferences sp = ctx.getSharedPreferences("aurora_alarms", Context.MODE_PRIVATE);
        Map<String, ?> all = sp.getAll();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (Map.Entry<String, ?> e : all.entrySet()) {
            try {
                int id = Integer.parseInt(e.getKey());
                String v = (String) e.getValue();
                if (!v.startsWith("D|")) continue; // sadece günlük alarmları kurtar
                String[] p = v.split("\\|", 6);
                int hour = Integer.parseInt(p[1]);
                int minute = Integer.parseInt(p[2]);
                String title = p[3];
                String body = p[4];
                String route = p[5];

                Calendar next = Calendar.getInstance();
                next.set(Calendar.HOUR_OF_DAY, hour);
                next.set(Calendar.MINUTE, minute);
                next.set(Calendar.SECOND, 0);
                next.set(Calendar.MILLISECOND, 0);
                if (!next.after(Calendar.getInstance())) {
                    next.add(Calendar.DAY_OF_YEAR, 1);
                }

                Intent al = new Intent(ctx, AuroraAlarmReceiver.class);
                al.putExtra("id", id);
                al.putExtra("title", title);
                al.putExtra("body", body);
                al.putExtra("route", route);
                al.putExtra("everyDayHour", hour);
                al.putExtra("everyDayMinute", minute);
                PendingIntent pi = PendingIntent.getBroadcast(ctx, id, al,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pi);
                }
            } catch (Exception ignored) {
            }
        }
    }
}
