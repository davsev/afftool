# HyperFrames project

Render (needs Node 22+, ffmpeg, and song.mp3 copied next to index.html from ../ai_video_pack/song.mp3):

```
npm i hyperframes@0.9.59
cp ../ai_video_pack/song.mp3 .
npx hyperframes lint .
npx hyperframes render . -o korkomain.mp4 -f 24 -w 4
```

The canvas renderer in js/ draws every frame from the hf-seek time; window.__hf.buildReady waits for fonts and kit images.
