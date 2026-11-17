#!/usr/bin/env python3
"""Cut AI-generated shots to the song and export the finished clip.

Put each generated clip in clips/ as shot01.mp4 ... shot33.mp4 (any resolution, any length >= the shot).
Missing shots fall back to the same shot from ../korkomain_kit_1080p.mp4, so you can preview at any stage.

  python3 assemble.py              -> final.mp4 (no burned subtitles)
  python3 assemble.py --subs       -> final_subs.mp4 (lyrics.srt burned in)
  python3 assemble.py --offset 12=0.8   -> start shot 12 from 0.8s into its clip (repeatable)
Needs ffmpeg on PATH.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FALLBACK = os.path.join(HERE, '..', 'korkomain_kit_1080p.mp4')
shots = json.load(open(os.path.join(HERE, 'shots.json'), encoding='utf-8'))
subs = '--subs' in sys.argv
offsets = {}
for i, a in enumerate(sys.argv):
    if a == '--offset' and i + 1 < len(sys.argv):
        k, v = sys.argv[i + 1].split('='); offsets[k.zfill(2)] = float(v)

tmp = os.path.join(HERE, '_parts'); os.makedirs(tmp, exist_ok=True)
VF = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24,setsar=1,format=yuv420p'
parts = []
for s in shots:
    n, start, dur = s['shot'], float(s['start']), float(s['duration_s'])
    src = os.path.join(HERE, 'clips', f'shot{n}.mp4')
    out = os.path.join(tmp, f'p{n}.mp4')
    if os.path.exists(src):
        cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', str(offsets.get(n, 0)), '-i', src, '-t', f'{dur:.3f}',
               '-vf', VF + f',tpad=stop_mode=clone:stop_duration={dur:.3f}', '-t', f'{dur:.3f}', '-an', '-c:v', 'libx264', '-crf', '18', out]
        tag = 'AI clip'
    else:
        cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', f'{start:.3f}', '-i', FALLBACK, '-t', f'{dur:.3f}', '-vf', VF, '-an', '-c:v', 'libx264', '-crf', '18', out]
        tag = 'placeholder'
    subprocess.run(cmd, check=True)
    parts.append(out); print(f'shot {n}: {dur:5.2f}s  {tag}')

lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
name = 'final_subs.mp4' if subs else 'final.mp4'
vf = []
if subs:
    ass = os.path.join(tmp, 'lyrics.ass')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(HERE, 'lyrics.srt'), ass], check=True)
    txt = open(ass, encoding='utf-8').read().replace('Style: Default,Arial,16', 'Style: Default,Heebo,22')
    open(ass, 'w', encoding='utf-8').write(txt)
    fonts = os.path.join(HERE, '..', 'fonts')
    vf = ['-vf', f"ass='{ass}':fontsdir='{fonts}'"]
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-i', os.path.join(HERE, 'song.mp3'),
                '-map', '0:v', '-map', '1:a', *vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac', '-b:a', '256k',
                '-shortest', '-movflags', '+faststart', os.path.join(HERE, name)], check=True)
print('wrote', name)
