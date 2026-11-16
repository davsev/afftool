import librosa, numpy as np, json
y, sr = librosa.load('song.mp3', sr=22050)
hop=512
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop, start_bpm=160, tightness=200)
bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
print('tempo', tempo, 'first beats', np.round(bt[:8],2), 'median ibi', np.median(np.diff(bt)))
C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
Mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=13)
Rm = librosa.feature.rms(y=y, hop_length=hop)
X = np.vstack([librosa.util.normalize(C), Mf/50, Rm*10])
Xs = librosa.util.sync(X, beats, aggregate=np.median)
for k in (14, 20):
    b = librosa.segment.agglomerative(Xs, k)
    bts = np.concatenate([[0], bt])[np.clip(b,0,len(bt))]
    print(k, np.round(bts,1).tolist())
# downbeat phase: onset strength summed at each of 4 phases
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
lowS = np.abs(librosa.stft(y, hop_length=hop))[:12].sum(0)
ph = [lowS[beats[i::4]].mean() for i in range(4)]
print('kick by phase', np.round(ph,1))
json.dump({'tempo': float(np.atleast_1d(tempo)[0]), 'beats': np.round(bt,3).tolist(), 'downphase': int(np.argmax(ph))}, open('beats.json','w'))
