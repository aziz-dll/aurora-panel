package com.gh0st.okulpaneli;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // WebView tam ekran açılsın; status bar altından başlamasın (aşağıdaki
        // safe-area insets'i CSS'te tek kaynak olarak uygulanıyor — çifte boşluk olmasın)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Custom Capacitor plugin: SharedPreferences-backed key/value store
        registerPlugin(AuroraStoragePlugin.class);
    }
}
