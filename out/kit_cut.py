import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
src = Image.open('../../images/1.webp').convert('RGB')
A = np.asarray(src).astype(np.int16)
def cutout(box, name, thr=200, sat=40, scale=3, keep_largest=True, pad=2):
    x0,y0,x1,y1 = box
    c = A[y0:y1, x0:x1]
    mx, mn = c.max(2), c.min(2)
    bgc = (mn > thr) & ((mx - mn) < sat)
    lab, n = nd.label(bgc)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
    bg = np.isin(lab, list(border))
    fg = ~bg
    fg = nd.binary_opening(fg, iterations=1)
    if keep_largest:
        l2, n2 = nd.label(fg)
        if n2 > 1:
            sizes = nd.sum(fg, l2, range(1, n2+1)); big = np.argmax(sizes) + 1
            keep = sizes > sizes.max() * 0.04  # keep big detached parts (e.g. sticks)
            fg = np.isin(l2, np.where(keep)[0] + 1)
    fg = nd.binary_fill_holes(fg) if name in ('drums',) else fg
    alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    im = Image.fromarray(c.astype(np.uint8)).convert('RGBA'); im.putalpha(alpha)
    bb = im.getbbox(); im = im.crop(bb)
    im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
    im.save(f'{name}.png'); print(name, im.size, bb)
cutout((296, 28, 416, 382), 'hero')
cutout((418, 40, 540, 382), 'singer')
cutout((526, 42, 650, 382), 'drummer')
cutout((638, 30, 782, 382), 'bassist')
cutout((298, 440, 380, 565), 'guitar')
cutout((380, 440, 505, 565), 'bass')
cutout((505, 440, 655, 565), 'drums')
# posters and logo: plain rectangular crops
def rect(box, name, scale=3):
    im = src.crop(box); im = im.resize((im.width*scale, im.height*scale), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2)); im.save(f'{name}.png'); print(name, im.size)
rect((10, 768, 118, 934), 'poster0')
rect((128, 768, 240, 934), 'poster1')
rect((250, 768, 364, 934), 'poster2')
rect((372, 766, 822, 934), 'banner')
cutout((8, 8, 280, 80), 'logo', thr=60, sat=255, keep_largest=False)
