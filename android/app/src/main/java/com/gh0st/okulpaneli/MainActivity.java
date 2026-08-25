package com.gh0st.okulpaneli;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Uygulama durum çubuğu ve gesture barının altına taşmasın (edge-to-edge'i zorla kapat)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
