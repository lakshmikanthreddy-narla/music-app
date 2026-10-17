# What was changed (and why)

Goal: make songs actually play, and when they don't, say exactly why.

## Playback fixes (Android native resolver)

- `modules/note-native/.../NoteNativeModule.kt`
  - YouTube audio URLs are tied to the YouTube client that produced them
    (ANDROID, IOS, VISIONOS). The app used to fetch every URL with a desktop
    Chrome User-Agent, which YouTube can refuse. The resolver now detects the
    client from the URL and returns that client's own User-Agent (taken from
    NewPipe Extractor itself), and `PlaybackEngine` sends it.
  - Before handing a URL to the player, the resolver now checks (tiny 2-byte
    request) that YouTube accepts it, and moves on to the next stream if not.
    App-style client URLs are preferred over WEB ones.
  - Failures now carry the real exception chain instead of a bare message.
- `modules/note-native/.../StreamProbe.kt` (new): the URL check described above.
- `modules/note-native/.../NoteNativeDownloader.kt`: default extraction
  User-Agent changed to the Firefox ESR string NewPipe Extractor is tested with.

## Honest error messages

Before: every failure showed "No playback source available for this track."
Now it shows a reason code and detail, for example
`No playback source available. [extraction_failed] ExtractionException: ...`
or `[stream_rejected] YouTube refused every audio URL (ANDROID/itag140=HTTP 403)`,
or `Couldn't play this track. [player] ...` when the audio player itself fails.
The banner on the Now Playing screen shows up to 6 lines.

- `src/providers/stream/NativeStreamSource.ts`: new reason `stream_rejected`,
  readable messages, one quiet retry for flaky failures, bot-check no longer
  disguised as "track unavailable".
- `src/playback/PlaybackEngine.ts`: player errors keep their own explanation.
- `src/screens/NowPlaying.tsx`: error banner shows more lines.

## Build fixes

- `package-lock.json` was out of sync with `package.json` (`npm ci` failed with
  8 missing packages). Regenerated; existing versions kept.
- `.github/workflows/build-apk.yml` (new): builds an installable arm64 APK on
  GitHub. Actions tab -> "Build Android APK" -> Run workflow -> download the
  `NOTE-apk` artifact when it finishes (about 15-25 minutes).

## Not changed

UI, features, and app logic are untouched. UI redesign and a real daily
"new releases" feed come after playback is confirmed working.
