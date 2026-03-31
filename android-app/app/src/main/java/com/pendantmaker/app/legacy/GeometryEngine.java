package com.pendantmaker.app.legacy;

import com.pendantmaker.app.model.PendantConfig;

public class GeometryEngine {
    public double clampBevel(PendantConfig config) {
        double max = Math.max(0.0, config.getThickness() / 2.0);
        return Math.min(Math.max(0.0, config.getBevelSize()), max);
    }

    public double innerWidth(PendantConfig config) {
        return Math.max(0.0, config.getWidth() - (clampBevel(config) * 2.0));
    }

    public double innerHeight(PendantConfig config) {
        return Math.max(0.0, config.getHeight() - (clampBevel(config) * 2.0));
    }
}
