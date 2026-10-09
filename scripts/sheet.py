import glob, sys
from PIL import Image
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 2
fs = sorted(glob.glob(d + '/*.png'))
first = Image.open(fs[0]); W = 1440 // cols; H = int(first.height * W / first.width)
s = Image.new('RGB', (W * cols, H * ((len(fs) + cols - 1) // cols)), 'gray')
for i, f in enumerate(fs):
    s.paste(Image.open(f).convert('RGB').resize((W, H)), ((i % cols) * W, (i // cols) * H))
s.save(d + '/sheet.jpg', quality=80)
print(len(fs))
