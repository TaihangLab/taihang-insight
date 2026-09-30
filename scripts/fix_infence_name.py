# -*- coding: utf-8 -*-
from pathlib import Path
p = Path(__file__).resolve().parents[1] / 'src/components/visionAI/monitoringWarning/components/DetectionOverlay.vue'
t = p.read_text(encoding='utf-8')
t2 = t.replace('const inFence = detection.in_fence !== false', 'const isInFence = detection.in_fence !== false', 1)
t2 = t2.replace('if (!inFence) {', 'if (!isInFence) {', 1)
t2 = t2.replace("const suffix = inFence ? '' : ' 栏外'", "const suffix = isInFence ? '' : ' 栏外'", 1)
p.write_text(t2, encoding='utf-8')
print('inFence count', t2.count('inFence'), 'isInFence', t2.count('isInFence'))
