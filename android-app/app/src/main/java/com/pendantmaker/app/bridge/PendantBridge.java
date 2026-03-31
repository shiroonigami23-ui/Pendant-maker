package com.pendantmaker.app.bridge;

import android.app.Activity;
import android.content.Intent;
import android.webkit.JavascriptInterface;

import org.json.JSONException;
import org.json.JSONObject;

public class PendantBridge {
    private final Activity activity;

    public PendantBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String validateManufacturing(String jsonPayload) {
        try {
            JSONObject payload = new JSONObject(jsonPayload);
            return EngravingValidator.validate(payload).toString();
        } catch (JSONException e) {
            return errorJson("Failed to validate config", e.getMessage());
        }
    }

    @JavascriptInterface
    public String estimateCost(String jsonPayload) {
        try {
            JSONObject payload = new JSONObject(jsonPayload);
            return PendantEstimator.estimate(payload).toString();
        } catch (JSONException e) {
            return errorJson("Failed to estimate cost", e.getMessage());
        }
    }

    @JavascriptInterface
    public void shareText(String text) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, text);
        Intent chooser = Intent.createChooser(shareIntent, "Share pendant design");
        activity.startActivity(chooser);
    }

    @JavascriptInterface
    public String getAppMeta() {
        try {
            JSONObject meta = new JSONObject();
            meta.put("platform", "android");
            meta.put("bridgeVersion", "1.0.0");
            return meta.toString();
        } catch (JSONException e) {
            return "{\"platform\":\"android\"}";
        }
    }

    private String errorJson(String message, String details) {
        try {
            JSONObject error = new JSONObject();
            error.put("error", message);
            error.put("details", details);
            return error.toString();
        } catch (JSONException ignored) {
            return "{\"error\":\"bridge_failure\"}";
        }
    }
}
