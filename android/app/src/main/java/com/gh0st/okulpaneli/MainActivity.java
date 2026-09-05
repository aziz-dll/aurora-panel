package com.gh0st.okulpaneli;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.gh0st.okulpaneli.widgets.Habit30Widget;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // WebView tam ekran açılsın; status bar altından başlamasın (aşağıdaki
        // safe-area insets'i CSS'te tek kaynak olarak uygulanıyor — çifte boşluk olmasın)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Custom Capacitor plugins
        registerPlugin(AuroraStoragePlugin.class);
        registerPlugin(AuroraNotificationPlugin.class);
        handleTapIntent(getIntent());
        // Uygulama açıldığında widget'ı tazele — kullanıcı uygulamayı
        // son açtığından beri DB değişmiş olabilir.
        refreshWidgets();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleTapIntent(intent);
        refreshWidgets();
    }

    @Override
    public void onResume() {
        super.onResume();
        refreshWidgets();
    }

    private void refreshWidgets() {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(this);
            if (mgr == null) return;
            // SharedPreferences'taki widget-data mevcutsa widget'ları updateAppWidget ile
            // yeniden çiz. PendingIntent broadcast (manifest exported=false) Android 12+'da
            // sorun çıkarabiliyor; bu yüzden doğrudan updateAppWidget(ComponentName, null)
            // çağırıyoruz — provider onUpdate'i tetikler.
            for (Class<?> c : new Class[]{
                    com.gh0st.okulpaneli.widgets.TodosWidget.class,
                    com.gh0st.okulpaneli.widgets.BatteryWidget.class,
                    com.gh0st.okulpaneli.widgets.ScheduleWidget.class,
                    com.gh0st.okulpaneli.widgets.HabitWidget.class,
                    com.gh0st.okulpaneli.widgets.ExamsWidget.class,
                    com.gh0st.okulpaneli.widgets.QuickNoteWidget.class,
                    Habit30Widget.class}) {
                ComponentName name = new ComponentName(this, c);
                int[] ids = mgr.getAppWidgetIds(name);
                if (ids != null && ids.length > 0) {
                    Intent update = new Intent(this, c);
                    update.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    update.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                    update.setPackage(getPackageName());
                    sendBroadcast(update);
                }
            }
        } catch (Exception ignored) {}
    }

    /**
     * Homescreen widgets and notifications open the app with a
     * {@code aurora://app/<route>} data URI. The loader page (top frame,
     * owns the bridge) reads the route from AuroraStorage and points the
     * panel iframe at it; AppPlugin's appUrlOpen covers the warm case.
     */
    private void handleTapIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!"aurora".equals(data.getScheme()) || !"app".equals(data.getHost())) return;
        String route = data.getPath();
        if (route == null || route.isEmpty()) route = "/";
        getSharedPreferences("aurora_storage", MODE_PRIVATE)
                .edit()
                .putString("pending-route", route)
                .apply();
    }
}
