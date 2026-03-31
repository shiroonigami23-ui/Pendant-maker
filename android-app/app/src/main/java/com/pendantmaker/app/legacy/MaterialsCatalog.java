package com.pendantmaker.app.legacy;

import java.util.Arrays;
import java.util.List;

public class MaterialsCatalog {
    public List<String> allMaterials() {
        return Arrays.asList(
                "silver",
                "gold",
                "rose-gold",
                "platinum",
                "white-gold",
                "titanium",
                "copper",
                "bronze"
        );
    }

    public boolean isPrecious(String material) {
        return "silver".equals(material)
                || "gold".equals(material)
                || "rose-gold".equals(material)
                || "platinum".equals(material)
                || "white-gold".equals(material);
    }
}
