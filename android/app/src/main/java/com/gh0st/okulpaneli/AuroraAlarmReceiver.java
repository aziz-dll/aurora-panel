package com.gh0st.okulpaneli;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.Calendar;

/**
 * AuroraNotificationPlugin'in kurduğu AlarmManager alarmlarını dinler.
 * Her alarm geldiğinde:
 *  1) kullanıcıya bildirimi gösterir (yüksek-öncelikli kanal üzerinden)
 *  2) eğer {@code everyDay} modundaysa bir sonraki gün için aynı saate yeni alarm kurar
 */
public class AuroraAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null) return;
        int id = intent.getIntExtra("id", 0);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String route = intent.getStringExtra("route");
        if (title == null) title = "Aurora";
        if (body == null) body = "";
        if (route == null) route = "/";

        // 1) Bildirimi göster
        showNotification(ctx, id, title, body, route);

        // 2) Günlük tekrarlama varsa yarın için yeniden kur
        int everyDayHour = intent.getIntExtra("everyDayHour", -1);
        int everyDayMinute = intent.getIntExtra("everyDayMinute", -1);
        if (everyDayHour >= 0) {
            Calendar next = Calendar.getInstance();
            next.add(Calendar.DAY_OF_YEAR, 1);
            next.set(Calendar.HOUR_OF_DAY, everyDayHour);
            next.set(Calendar.MINUTE, everyDayMinute);
            next.set(Calendar.SECOND, 0);
            next.set(Calendar.MILLISECOND, 0);

            Intent nextIntent = new Intent(ctx, AuroraAlarmReceiver.class);
            nextIntent.putExtras(intent.getExtras());
            PendingIntent pi = PendingIntent.getBroadcast(ctx, id, nextIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pi);
                }
            }
        } else {
            // Tek seferlikse SharedPreferences kaydını sil
            ctx.getSharedPreferences("aurora_alarms", Context.MODE_PRIVATE)
                    .edit().remove(String.valueOf(id)).apply();
        }
    }

    private void showNotification(Context ctx, int id, String title, String body, String route) {
        // Tıklayınca MainActivity açılsın; aurora://app/<route> deep-link'i pending-route'a yazılır
        Intent tap = new Intent(ctx, MainActivity.class);
        tap.setData(Uri.parse("aurora://app" + route));
        tap.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPi = PendingIntent.getActivity(ctx, id, tap,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, AuroraNotificationPlugin.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(contentPi)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(NotificationCompat.DEFAULT_ALL);

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            try {
                nm.notify(id, b.build());
            } catch (SecurityException ignored) {
                // POST_NOTIFICATIONS izni yoksa no-op
            }
        }
    }
}
