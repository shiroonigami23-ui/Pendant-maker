package com.pendantmaker.app.legacy;

import com.pendantmaker.app.model.PendantConfig;

public class CoreEngine {
    public double estimateFaceArea(PendantConfig config) {
        return Math.max(0.0, config.getWidth() * config.getHeight());
    }

    public double estimateBodyVolume(PendantConfig config) {
        return estimateFaceArea(config) * Math.max(0.0, config.getThickness()) * 0.42;
    }

    public boolean hasPrintableThickness(PendantConfig config) {
        return config.getThickness() >= 1.0;
    }
}
