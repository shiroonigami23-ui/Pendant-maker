package com.pendantmaker.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.pendantmaker.app.engine.CostEngine;
import com.pendantmaker.app.engine.ManufacturingValidator;
import com.pendantmaker.app.engine.SummaryFormatter;
import com.pendantmaker.app.model.CostEstimate;
import com.pendantmaker.app.model.PendantConfig;
import com.pendantmaker.app.model.ValidationResult;

public class MainActivity extends AppCompatActivity {
    private Spinner materialSpinner;
    private EditText widthInput;
    private EditText heightInput;
    private EditText thicknessInput;
    private EditText bevelInput;
    private EditText gemSizeInput;
    private EditText gemFacetsInput;
    private EditText engravingInput;
    private EditText engravingDepthInput;
    private EditText chainThicknessInput;
    private Switch hasGemSwitch;
    private Switch hasEngravingSwitch;
    private Switch hasBorderSwitch;
    private Switch hasChainSwitch;
    private TextView validationResultText;
    private TextView costResultText;

    private final ManufacturingValidator validator = new ManufacturingValidator();
    private final CostEngine costEngine = new CostEngine();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        bindViews();
        setupMaterialSpinner();
        wireActions();
    }

    private void bindViews() {
        materialSpinner = findViewById(R.id.materialSpinner);
        widthInput = findViewById(R.id.widthInput);
        heightInput = findViewById(R.id.heightInput);
        thicknessInput = findViewById(R.id.thicknessInput);
        bevelInput = findViewById(R.id.bevelInput);
        gemSizeInput = findViewById(R.id.gemSizeInput);
        gemFacetsInput = findViewById(R.id.gemFacetsInput);
        engravingInput = findViewById(R.id.engravingInput);
        engravingDepthInput = findViewById(R.id.engravingDepthInput);
        chainThicknessInput = findViewById(R.id.chainThicknessInput);
        hasGemSwitch = findViewById(R.id.hasGemSwitch);
        hasEngravingSwitch = findViewById(R.id.hasEngravingSwitch);
        hasBorderSwitch = findViewById(R.id.hasBorderSwitch);
        hasChainSwitch = findViewById(R.id.hasChainSwitch);
        validationResultText = findViewById(R.id.validationResultText);
        costResultText = findViewById(R.id.costResultText);
    }

    private void setupMaterialSpinner() {
        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                this,
                R.array.material_options,
                android.R.layout.simple_spinner_item
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        materialSpinner.setAdapter(adapter);
    }

    private void wireActions() {
        Button validateButton = findViewById(R.id.validateButton);
        Button estimateButton = findViewById(R.id.estimateButton);
        Button shareButton = findViewById(R.id.shareButton);

        validateButton.setOnClickListener(v -> {
            PendantConfig config = readConfig();
            ValidationResult result = validator.validate(config);
            validationResultText.setText(SummaryFormatter.formatValidation(result));
        });

        estimateButton.setOnClickListener(v -> {
            PendantConfig config = readConfig();
            CostEstimate estimate = costEngine.estimate(config);
            costResultText.setText(SummaryFormatter.formatCost(estimate));
        });

        shareButton.setOnClickListener(v -> {
            PendantConfig config = readConfig();
            ValidationResult validation = validator.validate(config);
            CostEstimate estimate = costEngine.estimate(config);
            String summary = SummaryFormatter.formatShareSummary(config, validation, estimate);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            intent.putExtra(Intent.EXTRA_SUBJECT, "Pendant Maker Design Summary");
            intent.putExtra(Intent.EXTRA_TEXT, summary);
            startActivity(Intent.createChooser(intent, getString(R.string.share_title)));
        });
    }

    private PendantConfig readConfig() {
        PendantConfig config = new PendantConfig();
        config.setMaterial(materialSpinner.getSelectedItem().toString());
        config.setWidth(parseDouble(widthInput, 30.0));
        config.setHeight(parseDouble(heightInput, 30.0));
        config.setThickness(parseDouble(thicknessInput, 2.0));
        config.setBevelSize(parseDouble(bevelInput, 0.3));
        config.setGemSize(parseDouble(gemSizeInput, 5.0));
        config.setGemFacets(parseDouble(gemFacetsInput, 16.0));
        config.setEngravingText(engravingInput.getText().toString().trim());
        config.setEngraveDepth(parseDouble(engravingDepthInput, 0.1));
        config.setChainLinkThickness(parseDouble(chainThicknessInput, 0.7));
        config.setHasGem(hasGemSwitch.isChecked());
        config.setHasEngraving(hasEngravingSwitch.isChecked());
        config.setHasBorder(hasBorderSwitch.isChecked());
        config.setHasChain(hasChainSwitch.isChecked());
        return config;
    }

    private double parseDouble(EditText input, double fallback) {
        try {
            return Double.parseDouble(input.getText().toString().trim());
        } catch (Exception ignored) {
            return fallback;
        }
    }
}
