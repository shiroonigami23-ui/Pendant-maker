package com.pendantmaker.app.legacy;

import com.pendantmaker.app.model.PendantConfig;

public class UiControlsService {
    public void enableGem(PendantConfig config, boolean enabled) {
        config.setHasGem(enabled);
        if (!enabled) {
            config.setGemSize(0.0);
            config.setGemFacets(0.0);
        }
    }

    public void enableEngraving(PendantConfig config, boolean enabled) {
        config.setHasEngraving(enabled);
        if (!enabled) {
            config.setEngravingText("");
            config.setEngraveDepth(0.0);
        }
    }
}
