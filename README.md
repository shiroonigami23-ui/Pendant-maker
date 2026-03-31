# Pendant Maker

[![CI](https://github.com/shiroonigami23-ui/Pendant-maker/actions/workflows/ci.yml/badge.svg)](https://github.com/shiroonigami23-ui/Pendant-maker/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/shiroonigami23-ui/Pendant-maker)](https://github.com/shiroonigami23-ui/Pendant-maker/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20(Java)-blue)](https://github.com/shiroonigami23-ui/Pendant-maker)

Native Java Android pendant design and estimation app with manufacturing validation, cost analysis, and release-ready APK workflow.

## Features

- Native Java UI workflow (material, dimensions, gem, engraving, chain).
- Java manufacturing checks with issue/warning reporting.
- Java cost engine with material pricing and mass estimation.
- Java share summary export via Android native share sheet.
- Java-first module replacements for legacy app layers:
  - `AppBootstrap`, `CoreEngine`, `GeometryEngine`, `MaterialsCatalog`,
  - `PresetLibrary`, `ProUtilsService`, `ProWorkbenchService`,
  - `UiControlsService`, `ExportUtilsService`.

## Android release build (Java native)

1. Configure release signing:

```bash
copy android-app\keystore.properties.example android-app\keystore.properties
```

2. Generate signed release APK:

```bash
android-app\gradlew.bat -p android-app assembleRelease
```

APK output:
`android-app/app/build/outputs/apk/release/app-release.apk`

## Project structure

- `android-app/app/src/main/java/com/pendantmaker/app/` - native Android activity
- `android-app/app/src/main/java/com/pendantmaker/app/engine/` - Java validation and cost engines
- `android-app/app/src/main/java/com/pendantmaker/app/model/` - Java data models
- `android-app/app/src/main/java/com/pendantmaker/app/legacy/` - Java replacements of former JS module layers
- `android-app/` - Android Gradle project and release config

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
