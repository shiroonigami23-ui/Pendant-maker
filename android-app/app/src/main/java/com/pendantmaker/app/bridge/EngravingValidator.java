package com.pendantmaker.app.bridge;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class EngravingValidator {
    private static final int MAX_ENGRAVING_CHARS = 42;

    private EngravingValidator() {
    }

    public static JSONObject validate(JSONObject config) throws JSONException {
        JSONArray issues = new JSONArray();
        JSONArray warnings = new JSONArray();

        double thickness = config.optDouble("thickness", 2.0);
        double bevelSize = config.optDouble("bevelSize", 0.0);
        boolean hasGem = config.optBoolean("hasGem", false);
        double gemSize = config.optDouble("gemSize", 0.0);
        double width = config.optDouble("width", 30.0);
        double height = config.optDouble("height", 30.0);
        boolean hasChain = config.optBoolean("hasChain", false);
        double chainLinkThickness = config.optDouble("chainLinkThickness", 1.0);
        boolean hasEngraving = config.optBoolean("hasEngraving", false);
        String engravingText = config.optString("engravingText", "");
        double engraveDepth = config.optDouble("engraveDepth", 0.0);
        String shape = config.optString("shape", "circle");
        double locketOpenAngle = config.optDouble("locketOpenAngle", 0.0);
        boolean hasWings = config.optBoolean("hasWings", false);
        double wingSize = config.optDouble("wingSize", 0.0);
        String settingStyle = config.optString("settingStyle", "");
        boolean hasBail = config.optBoolean("hasBail", false);
        String borderStyle = config.optString("borderStyle", "");
        boolean borderGems = config.optBoolean("borderGems", false);

        if (thickness < 1.0) {
            issues.put("Thickness is below 1.0mm. Increase thickness for structural strength.");
        }
        if (bevelSize > thickness / 2.0) {
            issues.put("Bevel is too large for selected thickness. Reduce bevel or increase thickness.");
        }
        if (hasGem && gemSize > Math.min(width, height) * 0.5) {
            warnings.put("Gem size is large relative to pendant face and may weaken structure.");
        }
        if (hasChain && chainLinkThickness < 0.5) {
            warnings.put("Chain thickness is below 0.5mm and may be fragile.");
        }
        if ("locket".equals(shape) && locketOpenAngle > 0) {
            warnings.put("Exporting while locket is open can affect manufacturability previews.");
        }
        if (hasWings && wingSize > 2.0 && thickness < 1.4) {
            warnings.put("Large wings with thin body can create weak joints near the base.");
        }
        if (hasGem && "minimal".equals(settingStyle) && gemSize > 10) {
            warnings.put("Minimal setting with a large gem may be insecure for production.");
        }
        if (hasEngraving && engraveDepth > 0.2 && thickness < 2.0) {
            issues.put("Deep engraving on thin pendant risks puncture or structural failure.");
        }
        if (hasChain && !hasBail && !"locket".equals(shape)) {
            warnings.put("Chain is enabled without bail; verify attachment strength.");
        }
        if ("pave".equals(borderStyle) && !borderGems) {
            warnings.put("Pave border style selected without border gems enabled.");
        }
        if (hasEngraving && engravingText.trim().length() > MAX_ENGRAVING_CHARS) {
            warnings.put("Engraving text is long and may lose legibility in production.");
        }

        JSONObject out = new JSONObject();
        out.put("pass", issues.length() == 0);
        out.put("issues", issues);
        out.put("warnings", warnings);
        out.put("engine", "java-native");
        return out;
    }
}
