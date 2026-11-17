import numpy as np, json
a=np.fromfile('audio.raw',dtype=np.float32); sr=22050; fps=24
hop=sr//fps; n=len(a)//hop
fr=a[:n*hop].reshape(n,hop)
rms=np.sqrt((fr**2).mean(1)); rms/=np.percentile(rms,99)
# low band onset via fft
spec=np.abs(np.fft.rfft(fr*np.hanning(hop),axis=1))
freqs=np.fft.rfftfreq(hop,1/sr)
low=spec[:,(freqs>40)&(freqs<150)].sum(1); hi=spec[:,(freqs>3000)].sum(1)
def onset(x):
    d=np.maximum(0,np.diff(x,prepend=x[0])); d/=np.percentile(d,99)+1e-9; return np.clip(d,0,1.5)
json.dump({'rms':np.round(np.clip(rms,0,1.5),3).tolist(),'kick':np.round(onset(low),3).tolist(),'snare':np.round(onset(hi),3).tolist()},open('env.json','w'))
print(n)
