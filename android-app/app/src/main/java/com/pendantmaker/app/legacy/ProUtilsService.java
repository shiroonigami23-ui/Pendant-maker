package com.pendantmaker.app.legacy;

import com.pendantmaker.app.engine.CostEngine;
import com.pendantmaker.app.engine.ManufacturingValidator;
import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public class ProUtilsService {
    private final ManufacturingValidator validator = new ManufacturingValidator();
    private final CostEngine costEngine = new CostEngine();

    public ValidationResult validateManufacturing(PendantConfig config) {
        return validator.validate(config);
    }

    public CostEstimate estimateCost(PendantConfig config) {
        return costEngine.estimate(config);
    }
}
