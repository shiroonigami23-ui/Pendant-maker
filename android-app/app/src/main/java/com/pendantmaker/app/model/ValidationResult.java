package com.pendantmaker.app.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ValidationResult {
    private final List<String> issues = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    public void addIssue(String issue) {
        issues.add(issue);
    }

    public void addWarning(String warning) {
        warnings.add(warning);
    }

    public List<String> getIssues() {
        return Collections.unmodifiableList(issues);
    }

    public List<String> getWarnings() {
        return Collections.unmodifiableList(warnings);
    }

    public boolean isPass() {
        return issues.isEmpty();
    }
}
