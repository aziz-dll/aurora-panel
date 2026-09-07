package com.gh0st.okulpaneli.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import com.gh0st.okulpaneli.MainActivity;
import com.gh0st.okulpaneli.R;

import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;

/**
 * Tüm Aurora widget provider'larının tabanı.
 *
 * 1) CRASH GUARD: Launcher, widget'ı eklerken onUpdate'i çağırır; buradaki
 *    bir exception launcher'da "Couldn't add widget" hatası olarak görünür.
 *    Alt sınıfın render'ı patlarsa boş bir kart çizip eklenmeyi garanti ederiz.
 * 2) Ortak deep-link PendingIntent fabrikası (provider'lar arasında kopyaydı).
 */
public abstract class AuroraWidgetBase extends AppWidgetProvider {

    /** Alt sınıf render gövdesi — onUpdate içinde çalışır, exception burada yakalanır. */
    protected abstract void renderSafe(Context context, AppWidgetManager mgr, int[] appWidgetIds);

    /** Çökme durumunda çizilecek basit layout — alt sınıf ana layout'unu verir. */
    protected int crashSafeLayoutId() {
        return R.layout.widget_habit30;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        try {
            renderSafe(context, mgr, appWidgetIds);
        } catch (Exception e) {
            android.util.Log.w("AuroraWidgets", getClass().getSimpleName() + " render failed", e);
            try {
                RemoteViews views = new RemoteViews(context.getPackageName(), crashSafeLayoutId());
                for (int id : appWidgetIds) mgr.updateAppWidget(id, views);
            } catch (Exception ignored) {}
        }
    }

    /** Panelin ilgili sayfasına aurora://app<route> deep-link'i ile açan PendingIntent. */
    static PendingIntent openAppPendingIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse("aurora://app" + route));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, route.hashCode(), intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
