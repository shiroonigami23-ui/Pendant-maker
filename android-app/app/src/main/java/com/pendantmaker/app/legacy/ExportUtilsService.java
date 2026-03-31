package com.pendantmaker.app.legacy;

import com.pendantmaker.app.engine.SummaryFormatter;
import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public class ExportUtilsService {
    public String exportAsText(PendantConfig config, ValidationResult validation, CostEstimate estimate) {
        return SummaryFormatter.formatShareSummary(config, validation, estimate);
    }
}
