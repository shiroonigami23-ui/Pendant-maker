# Pendant Maker

[![CI](https://github.com/shiroonigami23-ui/Pendant-maker/actions/workflows/ci.yml/badge.svg)](https://github.com/shiroonigami23-ui/Pendant-maker/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/shiroonigami23-ui/Pendant-maker)](https://github.com/shiroonigami23-ui/Pendant-maker/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%2B%20Android-blue)](https://github.com/shiroonigami23-ui/Pendant-maker)

Production-focused 3D pendant design tool with guided workflow, manufacturing validation, business estimation, export utilities, and a Java-powered Android app release.

## Features

- Guided workflow: Shape -> Material -> Gem -> Engraving -> Export.
- Real-time manufacturability checks and print profile constraints.
- Business tooling: cost estimate, BOM CSV export, and review link sharing.
- PDF report export for production handoff.
- Java-native Android bridge for:
  - manufacturing validation,
  - pricing estimation,
  - native share sheet integration.

## Web development

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open `http://localhost:5173`.

## Android release build (Java)

1. Build web assets and sync them into Android assets:

```bash
npm run android:prep
```

2. Configure release signing:

```bash
copy android-app\keystore.properties.example android-app\keystore.properties
```

3. Generate signed release APK:

```bash
android-app\gradlew.bat -p android-app assembleRelease
```

APK output:
`android-app/app/build/outputs/apk/release/app-release.apk`

## Quality commands

- `npm run lint`
- `npm run test`
- `npm run build`

## Project structure

- `main.js` - app entrypoint/module bootstrap
- `native-bridge.js` - Java bridge integration for Android WebView
- `pro-workbench.js` - workflow, validation, and business panel
- `pro-utils.js` - validation, pricing, BOM, share utilities
- `android-app/` - Java Android app and release build config

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
