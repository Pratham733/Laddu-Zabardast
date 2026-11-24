package com.ladduzabardast.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ExternalSignIn")
public class ExternalSignInPlugin extends Plugin {
    private String browserPackage() {
        return CustomTabsClient.getPackageName(getContext(), null);
    }

    @PluginMethod
    public void supportsAutomaticReturn(PluginCall call) {
        String provider = browserPackage();
        boolean supported = provider != null && CustomTabsClient.isAuthTabSupported(getContext(), provider);
        call.resolve(new JSObject().put("supported", supported));
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        Uri uri = url == null ? Uri.EMPTY : Uri.parse(url);
        if (!"https".equals(uri.getScheme()) || !"accounts.google.com".equals(uri.getHost())
                || uri.getPort() != -1 || uri.getUserInfo() != null
                || !"/o/oauth2/v2/auth".equals(uri.getPath())) {
            call.reject("Invalid Google sign-in link.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            String provider = browserPackage();
            boolean automatic = Boolean.TRUE.equals(call.getBoolean("automaticReturn", false));
            try {
                if (automatic && provider != null) {
                    ((MainActivity) getActivity()).openAuthTab(uri, provider);
                } else if (provider != null) {
                    CustomTabsIntent tab = new CustomTabsIntent.Builder().build();
                    tab.intent.setPackage(provider);
                    tab.launchUrl(getActivity(), uri);
                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE);
                    getActivity().startActivity(intent);
                }
                call.resolve();
            } catch (ActivityNotFoundException error) {
                call.reject("Install or enable a browser to sign in with Google.", error);
            }
        });
    }
}
