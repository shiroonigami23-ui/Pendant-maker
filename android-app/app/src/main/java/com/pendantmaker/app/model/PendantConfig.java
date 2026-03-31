package com.pendantmaker.app.model;

public class PendantConfig {
    private String material = "silver";
    private double width = 30.0;
    private double height = 30.0;
    private double thickness = 2.0;
    private double bevelSize = 0.3;
    private double gemSize = 5.0;
    private double gemFacets = 16.0;
    private String engravingText = "";
    private double engraveDepth = 0.1;
    private double chainLinkThickness = 0.7;
    private boolean hasGem;
    private boolean hasEngraving;
    private boolean hasBorder;
    private boolean hasChain;

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public double getWidth() {
        return width;
    }

    public void setWidth(double width) {
        this.width = width;
    }

    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public double getThickness() {
        return thickness;
    }

    public void setThickness(double thickness) {
        this.thickness = thickness;
    }

    public double getBevelSize() {
        return bevelSize;
    }

    public void setBevelSize(double bevelSize) {
        this.bevelSize = bevelSize;
    }

    public double getGemSize() {
        return gemSize;
    }

    public void setGemSize(double gemSize) {
        this.gemSize = gemSize;
    }

    public double getGemFacets() {
        return gemFacets;
    }

    public void setGemFacets(double gemFacets) {
        this.gemFacets = gemFacets;
    }

    public String getEngravingText() {
        return engravingText;
    }

    public void setEngravingText(String engravingText) {
        this.engravingText = engravingText;
    }

    public double getEngraveDepth() {
        return engraveDepth;
    }

    public void setEngraveDepth(double engraveDepth) {
        this.engraveDepth = engraveDepth;
    }

    public double getChainLinkThickness() {
        return chainLinkThickness;
    }

    public void setChainLinkThickness(double chainLinkThickness) {
        this.chainLinkThickness = chainLinkThickness;
    }

    public boolean isHasGem() {
        return hasGem;
    }

    public void setHasGem(boolean hasGem) {
        this.hasGem = hasGem;
    }

    public boolean isHasEngraving() {
        return hasEngraving;
    }

    public void setHasEngraving(boolean hasEngraving) {
        this.hasEngraving = hasEngraving;
    }

    public boolean isHasBorder() {
        return hasBorder;
    }

    public void setHasBorder(boolean hasBorder) {
        this.hasBorder = hasBorder;
    }

    public boolean isHasChain() {
        return hasChain;
    }

    public void setHasChain(boolean hasChain) {
        this.hasChain = hasChain;
    }
}
