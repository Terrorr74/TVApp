package com.tvapp

import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.fragment.app.FragmentActivity

class MainActivity : FragmentActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        configureWebView()
        webView.webViewClient = TvWebViewClient()
        webView.loadUrl("file:///android_asset/web/index.html")
    }

    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true

            // Required for localStorage (subscriptions persist across sessions)
            domStorageEnabled = true

            // HLS streams must autoplay without a user gesture
            mediaPlaybackRequiresUserGesture = false

            // Allow the WebView to read the bundled assets
            allowFileAccess = true

            // The page is served from file:// but fetches HTTPS (Piped API, HLS CDNs)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Improve rendering performance
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        // Enable hardware acceleration at the view level
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        // Forward Back key to WebView history first
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
