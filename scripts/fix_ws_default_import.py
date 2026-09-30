# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1]

replacements = [
    (
        root / 'src/components/visionAI/monitoringWarning/realTimeMonitoring.vue',
        "import { createDetectionWebSocket, closeWebSocket, parseDetectionMessage } from './utils/detectionWebSocket'",
        "import detectionWs from './utils/detectionWebSocket'\n"
        "const { createDetectionWebSocket, closeWebSocket, parseDetectionMessage } = detectionWs",
    ),
    (
        root / 'src/components/visionAI/monitoringWarning/components/EnhancedVideoCell.vue',
        "import { createDetectionWebSocket, closeWebSocket } from '../utils/detectionWebSocket'",
        "import detectionWs from '../utils/detectionWebSocket'\n"
        "const { createDetectionWebSocket, closeWebSocket } = detectionWs",
    ),
]

for path, old, new in replacements:
    text = path.read_text(encoding='utf-8')
    if old not in text:
        print(path.name, 'OLD missing; has detectionWs=', 'detectionWs' in text)
        continue
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print(path.name, 'updated')
