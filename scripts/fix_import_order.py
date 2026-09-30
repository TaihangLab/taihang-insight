# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'src/components/visionAI/monitoringWarning/realTimeMonitoring.vue'
t = p.read_text(encoding='utf-8')
bad = (
    "import detectionWs from './utils/detectionWebSocket'\n"
    "const { createDetectionWebSocket, closeWebSocket, parseDetectionMessage } = detectionWs\n"
    'import screenfull from "screenfull";'
)
good = (
    "import detectionWs from './utils/detectionWebSocket'\n"
    'import screenfull from "screenfull";\n'
    "const { createDetectionWebSocket, closeWebSocket, parseDetectionMessage } = detectionWs"
)
if bad in t:
    p.write_text(t.replace(bad, good, 1), encoding='utf-8')
    print('fixed import order')
else:
    print('pattern not found')
    i = t.find('detectionWs')
    print(repr(t[max(0, i - 80): i + 260]))

# EnhancedVideoCell may also have const between imports
p2 = Path(__file__).resolve().parents[1] / 'src/components/visionAI/monitoringWarning/components/EnhancedVideoCell.vue'
t2 = p2.read_text(encoding='utf-8')
print('enhanced snippet:')
i2 = t2.find('detectionWs')
print(repr(t2[max(0, i2 - 40): i2 + 220]))
