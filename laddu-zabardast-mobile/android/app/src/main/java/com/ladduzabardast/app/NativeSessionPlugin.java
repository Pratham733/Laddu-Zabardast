package com.ladduzabardast.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "NativeSession")
public class NativeSessionPlugin extends Plugin {
    private static final String KEY_ALIAS = "laddu-session-v1";

    private SharedPreferences storage() {
        return getContext().getSharedPreferences("laddu_session", Context.MODE_PRIVATE);
    }

    private String storageKey(PluginCall call) throws Exception {
        String server = call.getString("server");
        if (server == null || !(server.startsWith("https://") || server.startsWith("http://"))) {
            throw new IllegalArgumentException("A backend URL is required");
        }
        return Base64.encodeToString(
            MessageDigest.getInstance("SHA-256").digest(server.getBytes(StandardCharsets.UTF_8)),
            Base64.NO_WRAP
        );
    }

    private synchronized SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(KEY_ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(
                KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
            ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
             .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
             .build());
            generator.generateKey();
        }
        return (SecretKey) store.getKey(KEY_ALIAS, null);
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        String storageKey;
        try {
            storageKey = storageKey(call);
        } catch (Exception error) {
            call.reject("Invalid session server", error);
            return;
        }
        String stored = storage().getString(storageKey, null);
        if (stored == null) {
            call.resolve(new JSObject());
            return;
        }
        try {
            String[] parts = stored.split(":", 2);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
            String token = new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
            call.resolve(new JSObject().put("token", token));
        } catch (Exception error) {
            // An unavailable keystore key means the old session must be discarded.
            storage().edit().remove(storageKey).commit();
            call.resolve(new JSObject());
        }
    }

    @PluginMethod
    public void setToken(PluginCall call) {
        try {
            String token = call.getString("token");
            if (token == null || token.isEmpty()) throw new IllegalArgumentException("Token is empty");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            String encrypted = Base64.encodeToString(cipher.doFinal(token.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
            String value = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" + encrypted;
            if (!storage().edit().putString(storageKey(call), value).commit()) {
                throw new IllegalStateException("Could not persist session");
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not securely save the session", error);
        }
    }

    @PluginMethod
    public void clearToken(PluginCall call) {
        try {
            if (!storage().edit().remove(storageKey(call)).commit()) {
                throw new IllegalStateException("Could not remove session");
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not clear the session", error);
        }
    }
}
