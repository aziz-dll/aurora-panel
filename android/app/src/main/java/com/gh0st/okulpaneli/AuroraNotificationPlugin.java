package com.gh0st.okulpaneli;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import android.Manifest;
import android.content.pm.PackageManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Aurora'ya özel bildirim altyapısı — {@code @capacitor/local-notifications}
 * paketine bağımlı değil. Doğrudan Android NotificationManager + AlarmManager
 * kullanır. ID çakışması ve setExact sorunları için deterministik ID
 * şeması uygular.
 */
@CapacitorPlugin(name = "AuroraNotification")
public class AuroraNotificationPlugin extends Plugin {

    private static final String TAG = "AuroraNotif";
    public static final String CHANNEL_ID = "aurora-reminders";
    private static final String CHANNEL_NAME = "Aurora reminders";
    private static final String PREFS = "aurora_alarms";
    private static final long MAX_ID = 2_000_000_000L;

    @Override
    public void load() {
        super.load();
        ensureChannel();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;
        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Homework, exam, water, workout and habit reminders");
        ch.enableLights(true);
        ch.setLightColor(0xFF2383E2);
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 220, 180, 220});
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setShowBadge(true);
        nm.createNotificationChannel(ch);
    }

    /**
     * schedule({notifications:[{id, title, body, route, at|everyDay|delayMinutes}]})
     *
     * ID: pozitif int. String ise {@link #stableId(String)} ile deterministik int'e
     * çevrilir. JS tarafı "water-8", "todo-<id>", "exam-<id>" gibi string ID'ler
     * gönderebilir; Java aynı formülü uygular.
     */
    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray arr = call.getArray("notifications");
        if (arr == null) {
            call.reject("notifications[] is required");
            return;
        }
        int ok = 0;
        StringBuilder errs = new StringBuilder();
        for (int i = 0; i < arr.length(); i++) {
            try {
                JSONObject n = arr.getJSONObject(i);
                int id = (int) computeId(n);
                String title = n.optString("title", "Aurora");
                String body = n.optString("body", "");
                String route = n.optString("route", "/");

                Long oneShotAt = null;
                int everyDayHour = -1, everyDayMinute = -1;
                int delayMinutes = 0;

                if (n.has("everyDay")) {
                    JSONObject ed = n.getJSONObject("everyDay");
                    everyDayHour = ed.optInt("hour", 9);
                    everyDayMinute = ed.optInt("minute", 0);
                } else if (n.has("at")) {
                    oneShotAt = parseAt(n.get("at"));
                } else if (n.has("delayMinutes")) {
                    delayMinutes = n.optInt("delayMinutes", 0);
                } else {
                    delayMinutes = 0;
                }

                // Önce bu ID'ye ait eski alarmı iptal et (varsa)
                cancelInternal(id);

                scheduleInternal(id, title, body, route, oneShotAt, everyDayHour, everyDayMinute, delayMinutes);
                ok++;
                Log.d(TAG, "scheduled id=" + id + " title=\"" + title + "\" at=" + (oneShotAt != null ? oneShotAt : "everyDay=" + everyDayHour + ":" + everyDayMinute));
            } catch (Exception e) {
                Log.w(TAG, "schedule item " + i + " failed", e);
                errs.append("[").append(i).append(":").append(e.getMessage()).append("] ");
            }
        }
        JSObject ret = new JSObject();
        ret.put("scheduled", ok);
        if (errs.length() > 0) ret.put("errors", errs.toString().trim());
        call.resolve(ret);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        JSArray ids = call.getArray("ids");
        if (ids != null) {
            for (int i = 0; i < ids.length(); i++) {
                try {
                    int id = (int) ids.optLong(i, 0);
                    cancelInternal(id);
                } catch (Exception ignored) {}
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        // SharedPreferences'teki tüm ID'lerin alarmlarını iptal et
        Set<String> keys = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getAll().keySet();
        for (String k : keys) {
            try { cancelInternal(Integer.parseInt(k)); } catch (Exception ignored) {}
        }
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        if (nm != null) nm.cancelAll();
        Log.d(TAG, "cancelAll cleared " + keys.size() + " alarms");
        call.resolve();
    }

    /** Tek noktadan izin kontrolü — Android 13+ runtime izni ve ayarlardan
     *  kapatılma durumunu (tüm sürümler) kapsar. */
    static boolean notifEnabled(Context ctx) {
        return androidx.core.app.NotificationManagerCompat.from(ctx).areNotificationsEnabled();
    }

    /**
     * Mevcut izin durumunu döner — diyalog AÇMADAN bakmak için.
     * loader önce bunu çağırır, granted=false ise requestPermission'ı dener.
     */
    @PluginMethod
    public void permissionStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", notifEnabled(getContext()));
        call.resolve(ret);
    }

    /**
     * Tek noktadan teşhis: izin, kanal durumu, exact-alarm ve pil optimizasyonu.
     */
    @PluginMethod
    public void diagnostics(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("sdk", Build.VERSION.SDK_INT);
        ret.put("notificationsEnabled", notifEnabled(ctx));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            ret.put("exactAlarms", am != null && am.canScheduleExactAlarms());
        } else {
            ret.put("exactAlarms", true);
        }
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel ch = nm.getNotificationChannel(CHANNEL_ID);
            ret.put("channelExists", ch != null);
            ret.put("channelBlocked", ch != null && ch.getImportance() == NotificationManager.IMPORTANCE_NONE);
        } else {
            ret.put("channelExists", true);
            ret.put("channelBlocked", false);
        }
        ret.put("scheduledAlarms", ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getAll().size());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        // Android 13+ için runtime POST_NOTIFICATIONS izni diyaloğu.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        9101);
            }
        }
        androidx.core.app.NotificationManagerCompat nm = androidx.core.app.NotificationManagerCompat.from(getContext());
        JSObject ret = new JSObject();
        ret.put("granted", nm.areNotificationsEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent i = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void sendTest(PluginCall call) {
        try {
            // Test bildirimi için unique ID
            int id = (int) ((System.currentTimeMillis() / 1000L) % MAX_ID);
            String title = call.getString("title", "🔔 Aurora test");
            String body = call.getString("body", "Bildirimler çalışıyor.");
            String route = call.getString("route", "/");
            // AlarmManager'a hiç uğramadan anında göster — test yolu kanal + izin
            // zincirini tek başına sınar; alarm gecikmesi/devri testi bulanıklaştırmasın.
            showNow(id, title, body, route);
            Log.d(TAG, "sendTest id=" + id + " title=\"" + title + "\"");
            JSObject ret = new JSObject();
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    /** Test bildirimini beklemeden göster (kanal + izin zincirini sınar). */
    private void showNow(int id, String title, String body, String route) {
        Context ctx = getContext();
        Intent tap = new Intent(ctx, MainActivity.class);
        tap.setData(android.net.Uri.parse("aurora://app" + route));
        tap.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPi = PendingIntent.getActivity(ctx, (id % 900_000) + 10_000, tap,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(contentPi)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(NotificationCompat.DEFAULT_ALL);
        androidx.core.app.NotificationManagerCompat.from(ctx).notify(id, b.build());
    }

    /* ── Internal ─────────────────────────────────────────────────── */

    private long computeId(JSONObject n) throws Exception {
        Object raw = n.opt("id");
        if (raw instanceof Number) {
            long v = ((Number) raw).longValue();
            return v > 0 ? v : stableId(String.valueOf(v));
        }
        if (raw != null) return stableId(raw.toString());
        // Deterministic fallback — aynı title+body+route+schedule daima aynı ID
        String basis = n.optString("title", "") + "|" + n.optString("body", "") + "|"
                + n.optString("route", "/") + "|" + n.opt("at") + "|" + n.opt("everyDay")
                + "|" + n.opt("delayMinutes");
        return stableId(basis);
    }

    /**
     * String'i deterministik pozitif int'e çevir.
     * JS tarafı da aynı formülü uygulamalı: ((h ^ 0x5bd1e995) >>> 0) % 0x7fffffff
     */
    static long stableId(String s) {
        long h = 0;
        for (int i = 0; i < s.length(); i++) {
            h = (h * 31 + s.charAt(i)) & 0xFFFFFFFFL;
        }
        if (h < 0) h = -h;
        if (h == 0) h = 1;
        return h % MAX_ID;
    }

    private Long parseAt(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        if (v instanceof String) {
            String s = ((String) v).trim();
            try {
                if (s.length() == 10) s += "T09:00:00";
                s = s.replace(" ", "T");
                if (s.endsWith("Z")) s = s.substring(0, s.length() - 1);
                return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(s).getTime();
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    /**
     * Verilen ID için hem PendingIntent kaydını hem de AlarmManager alarmını
     * sil. Intent eşleşmesi yerine doğrudan ID ile siler.
     */
    private void cancelInternal(int id) {
        // 1) PendingIntent'i her iki mod için de getBroadcast ile dene
        for (int mode = 0; mode < 2; mode++) {
            Intent intent = buildAlarmIntent(getContext(), id, "", "", "/", null, mode == 0 ? 0 : -1, mode == 0 ? 0 : -1, 0);
            PendingIntent pi = PendingIntent.getBroadcast(
                    getContext(), id, intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                pi.cancel();
                AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
                if (am != null) am.cancel(pi);
            }
        }
        // 2) SharedPreferences kaydını sil
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(String.valueOf(id)).apply();
        // 3) Ekranda gösterilmişse kapat
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(id);
    }

    private void scheduleInternal(int id, String title, String body, String route,
                                  Long oneShotAt, int everyDayHour, int everyDayMinute,
                                  int delayMinutes) {
        Context ctx = getContext();

        if (everyDayHour >= 0) {
            // Günlük tekrar
            Calendar now = Calendar.getInstance();
            Calendar at = Calendar.getInstance();
            at.set(Calendar.HOUR_OF_DAY, everyDayHour);
            at.set(Calendar.MINUTE, everyDayMinute);
            at.set(Calendar.SECOND, 0);
            at.set(Calendar.MILLISECOND, 0);
            if (!at.after(now)) at.add(Calendar.DAY_OF_YEAR, 1);

            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putString(String.valueOf(id), "D|" + everyDayHour + "|" + everyDayMinute
                            + "|" + title + "|" + body + "|" + route)
                    .apply();

            Intent intent = buildAlarmIntent(ctx, id, title, body, route, null, everyDayHour, everyDayMinute, 0);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at.getTimeInMillis(), pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, at.getTimeInMillis(), pi);
                }
            }
        } else {
            long fireAt = oneShotAt != null ? oneShotAt
                    : System.currentTimeMillis() + (long) delayMinutes * 60_000L;
            if (fireAt <= System.currentTimeMillis()) {
                // Zamanı geçmiş — yoksay (geçmişe dönük bildirim spam olur)
                Log.d(TAG, "skip past id=" + id);
                return;
            }
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putString(String.valueOf(id), "O|" + fireAt + "|" + title + "|" + body + "|" + route)
                    .apply();

            Intent intent = buildAlarmIntent(ctx, id, title, body, route, null, -1, -1, 0);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, fireAt, pi);
                }
            }
        }
    }

    private Intent buildAlarmIntent(Context ctx, int id, String title, String body, String route,
                                    Long oneShotAt, int everyDayHour, int everyDayMinute, int delay) {
        Intent i = new Intent(ctx, AuroraAlarmReceiver.class);
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("route", route);
        if (oneShotAt != null) i.putExtra("oneShotAt", oneShotAt);
        if (everyDayHour >= 0) {
            i.putExtra("everyDayHour", everyDayHour);
            i.putExtra("everyDayMinute", everyDayMinute);
        }
        return i;
    }
}
