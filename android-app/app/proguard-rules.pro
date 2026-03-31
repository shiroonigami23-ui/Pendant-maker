# Keep JavaScript bridge methods.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
