package com.pendantmaker.app.engine;

import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public final class SummaryFormatter {
    private SummaryFormatter() {
    }

    public static String formatValidation(ValidationResult result) {
        StringBuilder sb = new StringBuilder();
        sb.append("Manufacturing Check: ").append(result.isPass() ? "PASS" : "FAIL").append("\n\n");

        if (result.getIssues().isEmpty()) {
            sb.append("Issues: none\n");
        } else {
            sb.append("Issues:\n");
            for (String issue : result.getIssues()) {
                sb.append("- ").append(issue).append("\n");
            }
        }

        if (result.getWarnings().isEmpty()) {
            sb.append("\nWarnings: none");
        } else {
            sb.append("\nWarnings:\n");
            for (String warning : result.getWarnings()) {
                sb.append("- ").append(warning).append("\n");
            }
        }
        return sb.toString().trim();
    }

    public static String formatCost(CostEstimate estimate) {
        return "Material: " + estimate.getMaterial() + "\n"
                + "Mass: " + estimate.getMassGrams() + " g\n"
                + "Metal: $" + estimate.getMetalCost() + "\n"
                + "Gem: $" + estimate.getGemCost() + "\n"
                + "Finish: $" + estimate.getFinishingCost() + "\n"
                + "Total: $" + estimate.getTotalUsd();
    }

    public static String formatShareSummary(PendantConfig config, ValidationResult validation, CostEstimate estimate) {
        return "Pendant Maker - Native Java Summary\n\n"
                + "Material: " + config.getMaterial() + "\n"
                + "Size: " + config.getWidth() + " x " + config.getHeight() + " x " + config.getThickness() + " mm\n"
                + "Gem enabled: " + config.isHasGem() + "\n"
                + "Engraving enabled: " + config.isHasEngraving() + "\n"
                + "Border enabled: " + config.isHasBorder() + "\n"
                + "Chain enabled: " + config.isHasChain() + "\n\n"
                + formatValidation(validation) + "\n\n"
                + formatCost(estimate);
    }
}
