package com.pendantmaker.app.bridge;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public final class PendantEstimator {
    private static final Map<String, Double> DENSITY_BY_MATERIAL = new HashMap<>();
    private static final Map<String, Double> USD_PER_GRAM = new HashMap<>();

    static {
        DENSITY_BY_MATERIAL.put("silver", 10.49);
        DENSITY_BY_MATERIAL.put("gold", 19.32);
        DENSITY_BY_MATERIAL.put("rose-gold", 15.6);
        DENSITY_BY_MATERIAL.put("platinum", 21.45);
        DENSITY_BY_MATERIAL.put("copper", 8.96);
        DENSITY_BY_MATERIAL.put("titanium", 4.5);
        DENSITY_BY_MATERIAL.put("white-gold", 15.8);
        DENSITY_BY_MATERIAL.put("bronze", 8.8);

        USD_PER_GRAM.put("silver", 0.9);
        USD_PER_GRAM.put("gold", 64.0);
        USD_PER_GRAM.put("rose-gold", 42.0);
        USD_PER_GRAM.put("platinum", 33.0);
        USD_PER_GRAM.put("copper", 0.01);
        USD_PER_GRAM.put("titanium", 0.02);
        USD_PER_GRAM.put("white-gold", 47.0);
        USD_PER_GRAM.put("bronze", 0.01);
    }

    private PendantEstimator() {
    }

    public static JSONObject estimate(JSONObject config) throws JSONException {
        String material = config.optString("material", "silver");
        double density = DENSITY_BY_MATERIAL.getOrDefault(material, 10.0);
        double price = USD_PER_GRAM.getOrDefault(material, 1.0);

        double width = config.optDouble("width", 30.0);
        double height = config.optDouble("height", 30.0);
        double thickness = config.optDouble("thickness", 2.0);

        double volumeMm3 = width * height * thickness * 0.42;
        double volumeCm3 = volumeMm3 / 1000.0;
        double massGrams = volumeCm3 * density;

        double gemCost = 0.0;
        if (config.optBoolean("hasGem", false)) {
            gemCost = 20.0 + config.optDouble("gemSize", 0.0) * 4.0 + config.optDouble("gemFacets", 0.0) * 0.3;
        }

        double finishingCost = 15.0
                + (config.optBoolean("hasEngraving", false) ? 10.0 : 0.0)
                + (config.optBoolean("hasBorder", false) ? 8.0 : 0.0);

        double metalCost = massGrams * price;
        double total = metalCost + gemCost + finishingCost;

        JSONObject result = new JSONObject();
        result.put("material", material);
        result.put("massGrams", round2(massGrams));
        result.put("metalCost", round2(metalCost));
        result.put("gemCost", round2(gemCost));
        result.put("finishingCost", round2(finishingCost));
        result.put("totalUsd", round2(total));
        result.put("engine", "java-native");
        return result;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
