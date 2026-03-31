package com.pendantmaker.app.legacy;

import com.pendantmaker.app.model.PendantConfig;

public class AppBootstrap {
    public PendantConfig defaultConfig() {
        PendantConfig config = new PendantConfig();
        config.setMaterial("silver");
        config.setWidth(30.0);
        config.setHeight(30.0);
        config.setThickness(2.0);
        config.setBevelSize(0.3);
        config.setGemSize(5.0);
        config.setGemFacets(16.0);
        return config;
    }
}
