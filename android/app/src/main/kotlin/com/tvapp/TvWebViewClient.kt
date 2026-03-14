package com.tvapp

import android.net.http.SslError
import android.webkit.SslErrorHandler
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class TvWebViewClient : WebViewClient() {

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()

        // Allow file:// assets (the React app itself)
        if (url.startsWith("file://")) return false

        // Block everything except the Piped API origin and HLS CDNs
        // The React app fetches these via fetch() / hls.js internally — WebView
        // does not navigate to them, so shouldOverrideUrlLoading won't be called
        // for XHR/fetch requests. Only top-level navigations reach here.
        return true // block all external navigations
    }

    @Suppress("WebViewClientOnReceivedSslError")
    override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
        // In production, reject SSL errors.
        // During development against a local dev server you may call handler.proceed() instead.
        handler.cancel()
    }
}
