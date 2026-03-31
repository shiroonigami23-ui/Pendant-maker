package com.pendantmaker.app.model;

public class CostEstimate {
    private final String material;
    private final double massGrams;
    private final double metalCost;
    private final double gemCost;
    private final double finishingCost;
    private final double totalUsd;

    public CostEstimate(String material, double massGrams, double metalCost, double gemCost, double finishingCost, double totalUsd) {
        this.material = material;
        this.massGrams = massGrams;
        this.metalCost = metalCost;
        this.gemCost = gemCost;
        this.finishingCost = finishingCost;
        this.totalUsd = totalUsd;
    }

    public String getMaterial() {
        return material;
    }

    public double getMassGrams() {
        return massGrams;
    }

    public double getMetalCost() {
        return metalCost;
    }

    public double getGemCost() {
        return gemCost;
    }

    public double getFinishingCost() {
        return finishingCost;
    }

    public double getTotalUsd() {
        return totalUsd;
    }
}
