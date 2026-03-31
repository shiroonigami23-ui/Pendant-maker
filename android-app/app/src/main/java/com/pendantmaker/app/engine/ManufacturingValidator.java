package com.pendantmaker.app.engine;

import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public class ManufacturingValidator {
    private static final int MAX_ENGRAVING_CHARS = 42;

    public ValidationResult validate(PendantConfig config) {
        ValidationResult result = new ValidationResult();

        if (config.getThickness() < 1.0) {
            result.addIssue("Thickness is below 1.0mm. Increase thickness for structural strength.");
        }
        if (config.getBevelSize() > config.getThickness() / 2.0) {
            result.addIssue("Bevel is too large for selected thickness. Reduce bevel or increase thickness.");
        }
        if (config.isHasGem() && config.getGemSize() > Math.min(config.getWidth(), config.getHeight()) * 0.5) {
            result.addWarning("Gem size is large relative to pendant face and may weaken structure.");
        }
        if (config.isHasChain() && config.getChainLinkThickness() < 0.5) {
            result.addWarning("Chain thickness is below 0.5mm and may be fragile.");
        }
        if (config.isHasEngraving() && config.getEngraveDepth() > 0.2 && config.getThickness() < 2.0) {
            result.addIssue("Deep engraving on thin pendant risks puncture or structural failure.");
        }
        if (config.isHasEngraving() && config.getEngravingText().length() > MAX_ENGRAVING_CHARS) {
            result.addWarning("Engraving text is long and may lose legibility in production.");
        }

        return result;
    }
}
