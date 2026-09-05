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

/**
 * Sticky-note widget: shows the most recent note title + first lines of
 * body. Tapping opens the notes page.
 *
 * Reads {@code widget-data.notes} from AuroraStorage.
 */
public class QuickNoteWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONObject note = readLatestNote(context);

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quicknote);
            views.setOnClickPendingIntent(R.id.widget_quicknote_root, openAppPendingIntent(context, "/notes"));
            render(views, note);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(RemoteViews views, JSONObject note) {
        views.setTextViewText(R.id.widget_quicknote_title, "LAST NOTE");
        if (note == null) {
            views.setTextViewText(R.id.widget_quicknote_meta, "");
            views.setViewVisibility(R.id.widget_quicknote_body, View.GONE);
            views.setViewVisibility(R.id.widget_quicknote_empty, View.VISIBLE);
            return;
        }
        String title = note.optString("title", "").trim();
        String body = note.optString("body", "").trim();
        if (title.isEmpty()) title = body.split("\\r?\\n", 2)[0];
        if (title.length() > 60) title = title.substring(0, 57) + "…";

        views.setTextViewText(R.id.widget_quicknote_meta, title);
        String preview = body;
        if (preview.length() > 220) preview = preview.substring(0, 217) + "…";
        views.setTextViewText(R.id.widget_quicknote_body, preview);
        views.setViewVisibility(R.id.widget_quicknote_empty, View.GONE);
        views.setViewVisibility(R.id.widget_quicknote_body, View.VISIBLE);
    }

    private static JSONObject readLatestNote(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            JSONArray notes = new JSONObject(raw).optJSONArray("notes");
            if (notes == null || notes.length() == 0) return null;
            return notes.optJSONObject(0);
        } catch (Exception e) {
            return null;
        }
    }

    static PendingIntent openAppPendingIntent(Context context, String route) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse("aurora://app" + route));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, route.hashCode(), intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
