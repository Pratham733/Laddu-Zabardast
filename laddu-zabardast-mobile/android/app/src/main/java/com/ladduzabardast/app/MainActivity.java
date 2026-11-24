package com.ladduzabardast.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.browser.auth.AuthTabIntent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final ActivityResultLauncher<Intent> signInLauncher =
            AuthTabIntent.registerActivityResultLauncher(this, result -> {
                if (result.resultCode == AuthTabIntent.RESULT_OK && result.resultUri != null) {
                    getBridge().onNewIntent(new Intent(Intent.ACTION_VIEW, result.resultUri));
                }
            });

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeSessionPlugin.class);
        registerPlugin(ExternalSignInPlugin.class);
        super.onCreate(savedInstanceState);
    }

    void openAuthTab(Uri url, String provider) {
        AuthTabIntent tab = new AuthTabIntent.Builder().build();
        tab.intent.setPackage(provider);
        tab.launch(signInLauncher, url, "ladduzabardast");
    }
}
