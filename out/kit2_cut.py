import numpy as np, json, os
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
src = Image.open('kit.png').convert('RGB'); A = np.asarray(src).astype(np.int16)
os.makedirs('p', exist_ok=True)
def mask(box, thr=200, sat=45, minfrac=0.03, holes_below=None):
    x0,y0,x1,y1 = box; c = A[y0:y1, x0:x1]
    mx, mn = c.max(2), c.min(2)
    bgc = (mn > thr) & ((mx - mn) < sat)
    lab, n = nd.label(bgc)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
    bg = np.isin(lab, list(border))
    if holes_below is not None:
        H = c.shape[0]
        for k, sl in enumerate(nd.find_objects(lab), 1):
            if sl is None: continue
            area = (lab[sl] == k).sum()
            if sl[0].start > holes_below * H and area > 60: bg |= (lab == k)
    fg = nd.binary_opening(~bg, iterations=1)
    l2, n2 = nd.label(fg)
    if n2 > 1:
        sizes = nd.sum(fg, l2, range(1, n2+1)); keep = np.where(sizes > sizes.max()*minfrac)[0] + 1
        fg = np.isin(l2, keep)
    return c, fg
def save(box, name, scale=3, **kw):
    c, fg = mask(box, **kw)
    ys, xs = np.where(fg); y0, y1, x0, x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
    c = c[y0:y1, x0:x1]; fg = fg[y0:y1, x0:x1]
    alpha = Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    im = Image.fromarray(c.astype(np.uint8)).convert('RGBA'); im.putalpha(alpha)
    im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 80, 2))
    im.save(f'p/{name}.png'); return im.size
def rect(box, name, scale=3, blur=0):
    im = src.crop(box); im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(blur)) if blur else im.filter(ImageFilter.UnsharpMask(2, 70, 2))
    im.save(f'p/{name}.jpg' if blur else f'p/{name}.png', quality=88) ; return im.size
sz = {}
for name, box in {'hero': (296,30,420,390), 'singer': (418,30,553,390), 'drummer': (545,30,662,390), 'bassist': (650,30,790,390)}.items():
    sz[name] = save(box, name, minfrac=0.15, holes_below=0.5)
X = lambda v: int(795 + v/2.2); Y = lambda v: int(25 + v/2.2)
XB = lambda v: int(1245 + v/2.2)
heads = {
 'singer': [(15,95,132,252),(135,95,252,252),(258,95,372,252)],
 'drummer': [(518,95,625,255),(630,95,738,255),(742,95,852,255),(855,95,965,255)],
}
for k, lst in heads.items():
    for i, (a,b,cc,d) in enumerate(lst): sz[f'{k}_h{i}'] = save((X(a),Y(b),X(cc),Y(d)), f'{k}_h{i}', minfrac=0.2)
for i, (a,b,cc,d) in enumerate([(0,85,108,250),(112,85,222,250),(222,85,332,250),(332,85,442,250)]): sz[f'bassist_h{i}'] = save((XB(a),Y(b),XB(cc),Y(d)), f'bassist_h{i}', minfrac=0.2)
for i, (a,b,cc,d) in enumerate([(472,85,582,252),(585,85,695,252),(698,85,808,252),(810,85,920,252)]): sz[f'hero_h{i}'] = save((XB(a),Y(b),XB(cc),Y(d)), f'hero_h{i}', minfrac=0.2)
# drummer parts: two stick arms + hoodie torso
sz['drum_armL'] = save((X(525),Y(272),X(762),Y(445)), 'drum_armL', minfrac=0.1)
sz['drum_armR'] = save((X(762),Y(272),X(955),Y(445)), 'drum_armR', minfrac=0.1)
sz['drum_torso'] = save((X(520),Y(462),X(765),Y(755)), 'drum_torso', minfrac=0.3)
# instruments / props
sz['drums'] = save((483,442,648,572), 'drums', minfrac=0.02)
sz['cup'] = save((1035,515,1085,575), 'cup', minfrac=0.2)
sz['spray'] = save((982,450,1018,505), 'spray', minfrac=0.2)
sz['papers'] = save((793,488,870,575), 'papers', minfrac=0.05)
sz['crowd'] = save((1105,448,1398,575), 'crowd', minfrac=0.02)
for i, b in enumerate([(9,770,121,936),(127,770,241,936),(247,770,362,936)]): sz[f'poster{i}'] = rect(b, f'poster{i}')
sz['title'] = rect((1113,772,1352,912), 'title')
# backgrounds: upscale 4x, soft focus
bgs = {'bg_wall': (298,598,580,736), 'bg_posters': (584,598,856,736), 'bg_street': (860,598,1058,736), 'bg_stage': (1063,598,1274,736), 'bg_night': (1279,598,1472,736)}
for k, b in bgs.items(): sz[k] = rect(b, k, scale=5, blur=3.2)
json.dump({k: list(v) for k, v in sz.items()}, open('p/sizes.json', 'w'))
print(sz)
