package expo.modules.notenative

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.speech.RecognizerIntent
import androidx.activity.result.contract.ActivityResultContracts
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.exceptions.AccountTerminatedException
import org.schabi.newpipe.extractor.exceptions.AgeRestrictedContentException
import org.schabi.newpipe.extractor.exceptions.ContentNotAvailableException
import org.schabi.newpipe.extractor.exceptions.ContentNotSupportedException
import org.schabi.newpipe.extractor.exceptions.ExtractionException
import org.schabi.newpipe.extractor.exceptions.GeographicRestrictionException
import org.schabi.newpipe.extractor.exceptions.PaidContentException
import org.schabi.newpipe.extractor.exceptions.PrivateContentException
import org.schabi.newpipe.extractor.exceptions.ReCaptchaException
import org.schabi.newpipe.extractor.exceptions.SignInConfirmNotBotException
import org.schabi.newpipe.extractor.exceptions.YoutubeMusicPremiumContentException
import org.schabi.newpipe.extractor.localization.ContentCountry
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.services.youtube.YoutubeParsingHelper
import org.schabi.newpipe.extractor.stream.AudioStream
import org.schabi.newpipe.extractor.stream.DeliveryMethod
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamType
import java.io.IOException

/**
 * NØTE's Android-only native surface.
 *
 * Only two things are exposed to JavaScript: a platform probe, and a single
 * stream-resolution call. The NewPipe Extractor API itself is deliberately NOT
 * bridged -- JS receives a small normalized record and nothing else.
 *
 * Every failure is returned as a structured `{ ok: false, reason, message }`
 * value rather than thrown, so a failed extraction can never take down the
 * React Native runtime.
 */
class NoteNativeModule : Module() {

  private companion object {
    /** Guards one-time NewPipe.init across concurrent resolves. */
    val initLock = Any()

    @Volatile
    var initialized = false

    /** At most this many streams are probed per resolve. */
    const val MAX_PROBES = 4

    /** Stop probing after this long and let the player try what we have. */
    const val PROBE_BUDGET_MS = 14_000L
  }

  override fun definition() = ModuleDefinition {
    Name("NoteNative")

    Function("getPlatformInfo") {
      return@Function mapOf(
        "platform" to "android",
        "native" to true,
        "androidSdkInt" to Build.VERSION.SDK_INT
      )
    }

    // AsyncFunction runs off the JS thread, which is required here: extraction
    // performs several blocking network round-trips.
    AsyncFunction("resolveYouTubeStream") { videoId: String ->
      resolveYouTubeStream(videoId)
    }

    var pendingVoicePromise: Promise? = null

    RegisterActivityContracts {
      val voiceLauncher = registerForActivityResult(
        "voiceSearch",
        ActivityResultContracts.StartActivityForResult()
      ) { result ->
        val promise = pendingVoicePromise
        pendingVoicePromise = null

        if (result.resultCode == Activity.RESULT_OK) {
          val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
          val spoken = matches?.firstOrNull() ?: ""
          promise?.resolve(spoken)
        } else {
          promise?.resolve("")
        }
      }

      AsyncFunction("startVoiceSearch") { promise: Promise ->
        try {
          pendingVoicePromise = promise
          val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
              RecognizerIntent.EXTRA_LANGUAGE_MODEL,
              RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Say a song or artist name...")
          }
          voiceLauncher.launch(intent)
        } catch (e: Throwable) {
          pendingVoicePromise = null
          promise.resolve("")
        }
      }
    }
  }

  private fun ensureInitialized() {
    if (initialized) return
    synchronized(initLock) {
      if (initialized) return
      NewPipe.init(
        NoteNativeDownloader(),
        Localization("en", "US"),
        ContentCountry("US")
      )
      initialized = true
    }
  }

  /** One playable audio URL plus the client identity it must be fetched with. */
  private class Candidate(
    val stream: AudioStream,
    val client: String,
    val userAgent: String,
    val rank: Int
  ) {
    val url: String get() = stream.content
    val label: String get() = "$client/itag${stream.id}"
  }

  private fun resolveYouTubeStream(videoId: String): Map<String, Any?> {
    if (videoId.isBlank()) {
      return failure("invalid_id", "No video id supplied")
    }

    return try {
      ensureInitialized()

      val url = "https://www.youtube.com/watch?v=$videoId"
      val info = StreamInfo.getInfo(ServiceList.YouTube, url)

      when (info.streamType) {
        StreamType.LIVE_STREAM,
        StreamType.AUDIO_LIVE_STREAM ->
          return failure("live_stream", "Live streams are not supported yet")
        StreamType.NONE ->
          return failure("unsupported", "No playable stream for this item")
        else -> Unit
      }

      val candidates = rankedProgressiveAudio(info.audioStreams)
      if (candidates.isEmpty()) {
        return failure("no_audio_stream", describeAudioStreams(info.audioStreams))
      }

      // Walk the candidates best-first and hand the player the first URL that
      // YouTube actually agrees to serve to the User-Agent we will send.
      val deadline = System.currentTimeMillis() + PROBE_BUDGET_MS
      val rejected = ArrayList<String>()
      var untested: Candidate? = null

      for (candidate in candidates.take(MAX_PROBES)) {
        if (System.currentTimeMillis() > deadline) break

        when (val outcome = StreamProbe.check(candidate.url, candidate.userAgent)) {
          is StreamProbe.Outcome.Ok -> return success(info, candidate)
          is StreamProbe.Outcome.Rejected ->
            rejected.add("${candidate.label}=HTTP ${outcome.code}")
          is StreamProbe.Outcome.Inconclusive -> {
            // The probe could not tell. Keep the best such candidate as a
            // fallback rather than discarding a URL that may well play.
            if (untested == null) untested = candidate
          }
        }
      }

      val fallback = untested
      if (fallback != null) return success(info, fallback)

      if (rejected.isNotEmpty()) {
        return failure(
          "stream_rejected",
          "YouTube refused every audio URL (" + rejected.joinToString(", ") + ")"
        )
      }

      // Probe budget ran out without a single answer: let the player try.
      success(info, candidates.first())
    } catch (e: Throwable) {
      classify(e)
    }
  }

  private fun success(info: StreamInfo, candidate: Candidate): Map<String, Any?> =
    mapOf(
      "ok" to true,
      "url" to candidate.url,
      "mimeType" to candidate.stream.format?.mimeType,
      "bitrate" to candidate.stream.averageBitrate,
      "durationSeconds" to info.duration,
      "title" to info.name,
      "uploader" to info.uploaderName,
      "streamType" to info.streamType.name,
      "extractor" to "NewPipeExtractor/v0.26.5",
      "client" to candidate.client,
      // googlevideo ties a stream URL to the client that asked for it, so the
      // player has to fetch it with that client's User-Agent or it gets a 4xx.
      "userAgent" to candidate.userAgent
    )

  /**
   * expo-audio plays progressive HTTP sources. DASH/HLS entries would resolve
   * fine here but fail at playback, so they are filtered out rather than
   * handed to the player.
   *
   * Streams from the app-style clients (ANDROID, IOS, VISIONOS) come first:
   * they are the ones that work without a proof-of-origin token. WEB URLs are
   * kept only as a last resort. Within a client, higher bitrate wins.
   */
  private fun rankedProgressiveAudio(streams: List<AudioStream>?): List<Candidate> =
    (streams ?: emptyList())
      .asSequence()
      .filter { it.deliveryMethod == DeliveryMethod.PROGRESSIVE_HTTP }
      .filter { it.isUrl && !it.content.isNullOrBlank() }
      .map { candidateFor(it) }
      .sortedWith(compareBy<Candidate> { it.rank }.thenByDescending { it.stream.averageBitrate })
      .toList()

  /** Work out which YouTube client produced this URL, and so which User-Agent it needs. */
  private fun candidateFor(stream: AudioStream): Candidate {
    val url = stream.content
    return when {
      YoutubeParsingHelper.isAndroidStreamingUrl(url) ->
        Candidate(stream, "ANDROID", YoutubeParsingHelper.getAndroidUserAgent(null), 0)
      YoutubeParsingHelper.isIosStreamingUrl(url) ->
        Candidate(stream, "IOS", YoutubeParsingHelper.getIosUserAgent(null), 1)
      YoutubeParsingHelper.isVisionOsStreamingUrl(url) ->
        Candidate(stream, "VISIONOS", YoutubeParsingHelper.getVisionOsUserAgent(null), 2)
      YoutubeParsingHelper.isWebStreamingUrl(url) ||
        YoutubeParsingHelper.isWebEmbeddedPlayerStreamingUrl(url) ->
        Candidate(stream, "WEB", NoteNativeDownloader.USER_AGENT, 4)
      else -> Candidate(stream, "OTHER", NoteNativeDownloader.USER_AGENT, 3)
    }
  }

  /** A short, human-readable account of why no progressive audio was usable. */
  private fun describeAudioStreams(streams: List<AudioStream>?): String {
    val all = streams ?: emptyList()
    if (all.isEmpty()) return "YouTube returned no audio streams for this video"

    val byMethod = all.groupingBy { it.deliveryMethod.name }.eachCount()
      .entries.joinToString(", ") { "${it.key}=${it.value}" }
    return "No progressive audio stream (${all.size} audio streams: $byMethod)"
  }

  /**
   * Map extractor and transport failures onto a small closed set of reasons the
   * TypeScript layer converts into NØTE's existing AppError kinds.
   *
   * The original message is always carried through -- nothing is swallowed.
   */
  private fun classify(e: Throwable): Map<String, Any?> {
    val message = describe(e)

    val reason = when (e) {
      is GeographicRestrictionException -> "geo_restricted"
      is AgeRestrictedContentException -> "age_restricted"
      is PaidContentException,
      is YoutubeMusicPremiumContentException -> "paid_content"
      is PrivateContentException -> "private_content"
      is AccountTerminatedException -> "unavailable"
      is SignInConfirmNotBotException -> "sign_in_required"
      is ReCaptchaException -> "rate_limited"
      is ContentNotSupportedException -> "unsupported"
      is ContentNotAvailableException -> "unavailable"
      is ExtractionException -> "extraction_failed"
      is IOException -> "network"
      else -> "unknown"
    }

    return failure(reason, message, e.javaClass.name)
  }

  /** `ExtractionException: message <- CauseException: message`, capped so it fits a banner. */
  private fun describe(e: Throwable): String {
    val parts = ArrayList<String>()
    var current: Throwable? = e
    var depth = 0
    while (current != null && depth < 3) {
      val text = current.message?.replace('\n', ' ')?.take(160)
      parts.add(current.javaClass.simpleName + if (text.isNullOrBlank()) "" else ": $text")
      val next = current.cause
      current = if (next === current) null else next
      depth++
    }
    return parts.joinToString(" <- ")
  }

  private fun failure(reason: String, message: String, exception: String? = null) =
    mapOf(
      "ok" to false,
      "reason" to reason,
      "message" to message,
      "exception" to exception
    )
}
