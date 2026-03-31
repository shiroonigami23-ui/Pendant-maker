package com.pendantmaker.app.legacy;

import com.pendantmaker.app.model.PendantConfig;

import java.util.LinkedHashMap;
import java.util.Map;

public class PresetLibrary {
    public Map<String, PendantConfig> buildDefaults() {
        Map<String, PendantConfig> presets = new LinkedHashMap<>();

        PendantConfig classic = new PendantConfig();
        classic.setMaterial("silver");
        classic.setWidth(28.0);
        classic.setHeight(32.0);
        classic.setThickness(2.1);
        presets.put("classic", classic);

        PendantConfig premium = new PendantConfig();
        premium.setMaterial("gold");
        premium.setWidth(30.0);
        premium.setHeight(35.0);
        premium.setThickness(2.4);
        premium.setHasGem(true);
        premium.setGemSize(6.5);
        presets.put("premium", premium);

        return presets;
    }
}
