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

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Upcoming exams widget. Each row shows a colored day-chip (red = today,
 * amber = within 7 days, green = later) and the exam title with subject.
 *
 * Reads {@code widget-data.exams} from AuroraStorage.
 */
public class ExamsWidget extends AppWidgetProvider {

    private static final String PREFS = "aurora_storage";
    private static final String KEY = "widget-data";
    private static final int MAX_ROWS = 4;

    private static final int RED = 0xFFDC2626;
    private static final int AMBER = 0xFFD9730D;
    private static final int GREEN = 0xFF16A34A;
    private static final int BLUE = 0xFF2383E2;
    private static final int GRAY = 0xFF9A9AA3;

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] appWidgetIds) {
        JSONArray exams = readExams(context);
        int n = exams == null ? 0 : exams.length();

        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_exams);
            views.setOnClickPendingIntent(R.id.widget_exams_root, openAppPendingIntent(context, "/student"));
            render(context, views, exams, n);
            mgr.updateAppWidget(id, views);
        }
    }

    private static void render(Context context, RemoteViews views, JSONArray exams, int total) {
        views.setTextViewText(R.id.widget_exams_title, "EXAMS");
        views.setTextViewText(R.id.widget_exams_meta, total > 0 ? total + " upcoming" : "");

        views.removeAllViews(R.id.widget_exams_list);
        if (total == 0) {
            views.setViewVisibility(R.id.widget_exams_list, View.GONE);
            views.setViewVisibility(R.id.widget_exams_empty, View.VISIBLE);
            return;
        }

        views.setViewVisibility(R.id.widget_exams_list, View.VISIBLE);
        views.setViewVisibility(R.id.widget_exams_empty, View.GONE);

        int rows = Math.min(total, MAX_ROWS);
        for (int i = 0; i < rows; i++) {
            JSONObject e = exams.optJSONObject(i);
            if (e == null) continue;
            RemoteViews item = new RemoteViews(context.getPackageName(), R.layout.widget_exam_item);

            int days = daysUntil(e.optString("date", ""));
            int color;
            if (days < 0) color = GRAY;
            else if (days == 0) color = RED;
            else if (days <= 7) color = AMBER;
            else color = GREEN;

            item.setTextViewText(R.id.widget_exam_days_bg, days < 0 ? "—" : String.valueOf(days));
            item.setInt(R.id.widget_exam_days_bg, "setBackgroundColor", color);
            item.setTextViewText(R.id.widget_exam_days_label, days == 1 ? "day" : "days");

            item.setTextViewText(R.id.widget_exam_title, e.optString("title", ""));
            String sub = buildSub(e, days);
            item.setTextViewText(R.id.widget_exam_sub, sub);
            item.setOnClickPendingIntent(R.id.widget_exam_item_root,
                    openAppPendingIntent(context, "/student"));
            views.addView(R.id.widget_exams_list, item);
        }
    }

    private static String buildSub(JSONObject e, int days) {
        String subject = e.optString("courseId", "");
        String date = e.optString("date", "");
        String time = e.optString("time", "");
        String pretty = "";
        if (!date.isEmpty()) {
            try {
                String[] p = date.split("-");
                Calendar c = Calendar.getInstance();
                c.clear();
                c.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
                pretty = new SimpleDateFormat("EEE d MMM", Locale.US).format(c.getTime());
            } catch (Exception ex) {
                pretty = date;
            }
        }
        StringBuilder sb = new StringBuilder();
        if (!subject.isEmpty()) sb.append(subject);
        if (!pretty.isEmpty()) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append(pretty);
        }
        if (days == 0 && !time.isEmpty()) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append(time);
        }
        return sb.toString();
    }

    static int daysUntil(String iso) {
        if (iso == null || iso.isEmpty()) return Integer.MAX_VALUE;
        try {
            String[] p = iso.split("-");
            Calendar due = Calendar.getInstance();
            due.clear();
            due.set(Integer.parseInt(p[0]), Integer.parseInt(p[1]) - 1, Integer.parseInt(p[2]));
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            return (int) ((due.getTimeInMillis() - today.getTimeInMillis()) / 86_400_000L);
        } catch (Exception e) {
            return Integer.MAX_VALUE;
        }
    }

    private static JSONArray readExams(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString(KEY, null);
            if (raw == null) return null;
            return new JSONObject(raw).optJSONArray("exams");
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
