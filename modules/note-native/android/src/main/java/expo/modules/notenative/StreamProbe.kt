package expo.modules.notenative

import java.net.HttpURLConnection
import java.net.URL

/**
 * Asks googlevideo, before the player ever sees a URL, whether it will actually
 * serve that URL to the client identity (User-Agent) we are about to use.
 *
 * Why this exists: with the current NewPipe Extractor the stream URLs come from
 * YouTube's ANDROID, IOS and VISIONOS clients, and each of those URLs is tied to
 * its own client. Fetching one with a different User-Agent is answered with an
 * HTTP 4xx. Probing turns that into a visible, per-stream result and lets the
 * resolver fall through to the next candidate instead of handing the player a
 * URL that is already known to be dead.
 *
 * Only a definitive 4xx counts as a rejection. Timeouts, 5xx and rate limiting
 * are "inconclusive": they say nothing about the URL, so they never block
 * playback on their own.
 */
object StreamProbe {

  const val TIMEOUT_MS = 6_000

  sealed class Outcome {
    /** The server answered 2xx for a tiny ranged request. */
    object Ok : Outcome()

    /** The server definitively refused this URL / User-Agent pair. */
    data class Rejected(val code: Int) : Outcome()

    /** The probe itself failed (timeout, 5xx, 429 ...); the URL may still be fine. */
    data class Inconclusive(val why: String) : Outcome()
  }

  fun check(url: String, userAgent: String): Outcome {
    var connection: HttpURLConnection? = null
    return try {
      connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"
        connectTimeout = TIMEOUT_MS
        readTimeout = TIMEOUT_MS
        instanceFollowRedirects = true
        setRequestProperty("User-Agent", userAgent)
        // Two bytes is enough to prove the URL is served; never download audio here.
        setRequestProperty("Range", "bytes=0-1")
        setRequestProperty("Accept-Encoding", "identity")
      }

      val code = connection.responseCode
      when {
        code in 200..299 -> Outcome.Ok
        // Rate limiting and an unsatisfiable range say nothing about the URL itself.
        code == 429 || code == 416 -> Outcome.Inconclusive("HTTP $code")
        code in 400..499 -> Outcome.Rejected(code)
        else -> Outcome.Inconclusive("HTTP $code")
      }
    } catch (e: Throwable) {
      Outcome.Inconclusive(e.javaClass.simpleName + ": " + (e.message ?: ""))
    } finally {
      connection?.disconnect()
    }
  }
}
