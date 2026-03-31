package com.pendantmaker.app.engine;

import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;

import java.util.HashMap;
import java.util.Map;

public class CostEngine {
    private final Map<String, Double> densityByMaterial = new HashMap<>();
    private final Map<String, Double> usdPerGram = new HashMap<>();

    public CostEngine() {
        densityByMaterial.put("silver", 10.49);
        densityByMaterial.put("gold", 19.32);
        densityByMaterial.put("rose-gold", 15.6);
        densityByMaterial.put("platinum", 21.45);
        densityByMaterial.put("copper", 8.96);
        densityByMaterial.put("titanium", 4.5);
        densityByMaterial.put("white-gold", 15.8);
        densityByMaterial.put("bronze", 8.8);

        usdPerGram.put("silver", 0.9);
        usdPerGram.put("gold", 64.0);
        usdPerGram.put("rose-gold", 42.0);
        usdPerGram.put("platinum", 33.0);
        usdPerGram.put("copper", 0.01);
        usdPerGram.put("titanium", 0.02);
        usdPerGram.put("white-gold", 47.0);
        usdPerGram.put("bronze", 0.01);
    }

    public CostEstimate estimate(PendantConfig config) {
        String material = config.getMaterial() == null ? "silver" : config.getMaterial().toLowerCase();
        double density = densityByMaterial.getOrDefault(material, 10.0);
        double price = usdPerGram.getOrDefault(material, 1.0);

        double volumeMm3 = config.getWidth() * config.getHeight() * config.getThickness() * 0.42;
        double volumeCm3 = volumeMm3 / 1000.0;
        double massGrams = volumeCm3 * density;

        double gemCost = 0.0;
        if (config.isHasGem()) {
            gemCost = 20.0 + config.getGemSize() * 4.0 + config.getGemFacets() * 0.3;
        }

        double finishingCost = 15.0
                + (config.isHasEngraving() ? 10.0 : 0.0)
                + (config.isHasBorder() ? 8.0 : 0.0);

        double metalCost = massGrams * price;
        double total = metalCost + gemCost + finishingCost;

        return new CostEstimate(
                material,
                round2(massGrams),
                round2(metalCost),
                round2(gemCost),
                round2(finishingCost),
                round2(total)
        );
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
