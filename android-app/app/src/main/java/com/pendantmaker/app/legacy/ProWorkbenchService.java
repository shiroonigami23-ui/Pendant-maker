package com.pendantmaker.app.legacy;

import com.pendantmaker.app.engine.SummaryFormatter;
import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public class ProWorkbenchService {
    private final ProUtilsService proUtilsService = new ProUtilsService();

    public String buildStatus(PendantConfig config) {
        ValidationResult validation = proUtilsService.validateManufacturing(config);
        CostEstimate estimate = proUtilsService.estimateCost(config);
        return SummaryFormatter.formatShareSummary(config, validation, estimate);
    }
}
