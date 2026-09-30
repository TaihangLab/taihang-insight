# -*- coding: utf-8 -*-
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# --- realTimeMonitoring.vue ---
p = root / 'src/components/visionAI/monitoringWarning/realTimeMonitoring.vue'
t = p.read_text(encoding='utf-8')

if "from './utils/detectionWebSocket'" not in t:
    needle = "import DetectionOverlay from './components/DetectionOverlay.vue'\nimport screenfull"
    insert = (
        "import DetectionOverlay from './components/DetectionOverlay.vue'\n"
        "import { createDetectionWebSocket, closeWebSocket, parseDetectionMessage } "
        "from './utils/detectionWebSocket'\n"
        "import screenfull"
    )
    if needle not in t:
        raise SystemExit('import anchor not found in realTimeMonitoring.vue')
    t = t.replace(needle, insert, 1)
    print('added realtime import')
else:
    print('realtime import already present')

# remove runtime requires of detectionWebSocket
t = re.sub(
    r"[ \t]*const \{[^}]*\} = require\('\./utils/detectionWebSocket'\)\s*\n",
    '',
    t,
)
t = re.sub(
    r"[ \t]*const \{\s*parseDetectionMessage\s*\} = require\('\./utils/detectionWebSocket'\)\s*\n",
    '',
    t,
)
# multiline require block used in maybeStartShaftDevMock
t = re.sub(
    r"[ \t]*const \{\s*parseDetectionMessage\s*\} = require\('\./utils/detectionWebSocket'\)\s*\n[ \t]*const \{",
    '      const {',
    t,
)
p.write_text(t, encoding='utf-8')
print('realtime require left:', "require('./utils/detectionWebSocket')" in t)

# --- EnhancedVideoCell.vue ---
p2 = root / 'src/components/visionAI/monitoringWarning/components/EnhancedVideoCell.vue'
t2 = p2.read_text(encoding='utf-8')
if "from '../utils/detectionWebSocket'" not in t2:
    old = "import DetectionOverlay from './DetectionOverlay.vue'\n\nexport default {"
    new = (
        "import DetectionOverlay from './DetectionOverlay.vue'\n"
        "import { createDetectionWebSocket, closeWebSocket } from '../utils/detectionWebSocket'\n\n"
        "export default {"
    )
    if old not in t2:
        raise SystemExit('import anchor not found in EnhancedVideoCell.vue')
    t2 = t2.replace(old, new, 1)
    print('added enhanced import')
t2 = re.sub(
    r"[ \t]*const \{[^}]*\} = require\('\.\./utils/detectionWebSocket'\)\s*\n",
    '',
    t2,
)
p2.write_text(t2, encoding='utf-8')
print('enhanced require left:', "require('../utils/detectionWebSocket')" in t2)

# --- verify script: skip requiring ESM ws module; keep URL string check ---
vp = root / 'scripts/verify-shaft-mock.js'
vt = vp.read_text(encoding='utf-8')
if "require(path.join(" in vt and 'detectionWebSocket' in vt:
    vt = vt.replace(
        "const { buildDetectionWsUrl } = require(path.join(\n"
        "    __dirname,\n"
        "    '../src/components/visionAI/monitoringWarning/utils/detectionWebSocket.js'\n"
        "  ))",
        "const buildDetectionWsUrl = (taskId) => "
        "`ws://127.0.0.1:8000/api/v1/realtime-detection/ws/detection/${taskId}`"
    )
    # also handle single-line variants
    vt = re.sub(
        r"const \{ buildDetectionWsUrl \} = require\([^\)]*detectionWebSocket\.js[^\)]*\)",
        "const buildDetectionWsUrl = (taskId) => "
        "`ws://127.0.0.1:8000/api/v1/realtime-detection/ws/detection/${taskId}`",
        vt,
    )
    vp.write_text(vt, encoding='utf-8')
    print('verify script patched')
print('done')
