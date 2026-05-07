const hints = new Map();
hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
  ZXing.BarcodeFormat.CODE_39,
  ZXing.BarcodeFormat.CODE_128,
  ZXing.BarcodeFormat.EAN_13,
  ZXing.BarcodeFormat.EAN_8,
  ZXing.BarcodeFormat.QR_CODE,
]);

const codeReader = new ZXing.BrowserMultiFormatReader(hints);
let scanning = false;
let scanCount = 0;
let lastScanned = '';
let lastScannedTime = 0;

async function startScanner() {
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('stop-btn').classList.remove('hidden');
  scanning = true;

  try {
    await codeReader.decodeFromConstraints(
      { audio: false, video: { facingMode: 'environment' } },
      'video',
      (result, err) => {
        if (result && scanning) {
          const text = result.getText();
          const format = result.getBarcodeFormat();
          const now = Date.now();

          // Prevent duplicate scans within 2 seconds
          if (text === lastScanned && now - lastScannedTime < 2000) return;
          lastScanned = text;
          lastScannedTime = now;

          addScanToList(text, format);
          navigator.vibrate?.(200);
        }
      }
    );
  } catch (err) {
    alert('Camera error: ' + err.message);
    stopScanner();
  }
}

function stopScanner() {
  scanning = false;
  codeReader.reset();
  document.getElementById('stop-btn').classList.add('hidden');
  document.getElementById('start-btn').classList.remove('hidden');
}

function addScanToList(text, format) {
  scanCount++;
  document.getElementById('count').textContent = scanCount + ' scanned';

  const list = document.getElementById('scan-list');
  const empty = list.querySelector('.empty-msg');
  if (empty) empty.remove();

  const id = 'scan-' + scanCount;

  const item = document.createElement('div');
  item.className = 'scan-item';
  item.id = id;
  item.innerHTML = `
    <div class="scan-info">
      <div class="scan-value">${text}</div>
      <div class="scan-format">${format}</div>
    </div>
    <span class="scan-status status-pending" id="status-${id}">Pending</span>
    <div class="scan-actions">
      <button class="action-btn approve-btn" onclick="setStatus('${id}', 'approved')" title="Approve">✓</button>
      <button class="action-btn deny-btn" onclick="setStatus('${id}', 'denied')" title="Deny">✗</button>
    </div>
  `;

  list.prepend(item);
}

function setStatus(id, status) {
  const statusEl = document.getElementById('status-' + id);
  statusEl.className = 'scan-status status-' + status;
  statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function toggleInfoPopup() {
  const popup = document.getElementById('info-popup');
  popup.classList.toggle('hidden');
}

// Close popup when clicking outside
document.addEventListener('click', (e) => {
  const popup = document.getElementById('info-popup');
  const icon = document.querySelector('.info-icon');
  if (!popup.contains(e.target) && !icon.contains(e.target)) {
    popup.classList.add('hidden');
  }
});