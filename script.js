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
let currentStream = null;

const customIdImages = new Map([
  ['4157984206', 'https://raw.githubusercontent.com/camelchickentoes/barcode/main/kaicenat.jpeg'],
  ['4157981692', 'https://raw.githubusercontent.com/camelchickentoes/barcode/main/chad.jpeg'],
  ['4157647430', 'https://raw.githubusercontent.com/camelchickentoes/barcode/main/kaden.jpeg'],
  // Add your own ID-to-image mappings here using relative paths or URLs.
]);

function getImageForId(text) {
  if (!text) return null;
  return customIdImages.get(text) || null;
}

async function enableTorch(stream) {
  const [track] = stream.getVideoTracks();
  if (!track || typeof track.getCapabilities !== 'function') return;

  const capabilities = track.getCapabilities();
  if (!capabilities.torch) return;

  try {
    await track.applyConstraints({ advanced: [{ torch: true }] });
  } catch (err) {
    console.warn('Torch not available:', err);
  }
}

async function startScanner() {
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('stop-btn').classList.remove('hidden');
  scanning = true;

  try {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });

    currentStream = stream;
    await enableTorch(stream);

    await codeReader.decodeFromStream(stream, video, (result, err) => {
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.warn('ZXing decode error:', err);
      }

      if (result && scanning) {
        const text = result.getText().trim();
        const format = result.getBarcodeFormat();

        // Only allow a repeated ID after a different ID has been scanned first
        if (text === lastScanned) return;

        lastScanned = text;

        addScanToList(text, format);
        navigator.vibrate?.(200);
      }
    });
  } catch (err) {
    alert('Camera error: ' + (err.message || err));
    stopScanner();
  }
}

function stopScanner() {
  scanning = false;
  codeReader.reset();

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }

  const video = document.getElementById('video');
  video.pause();
  video.srcObject = null;

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

  const imageUrl = getImageForId(text);

  const item = document.createElement('div');
  item.className = 'scan-item';
  item.id = id;
  item.innerHTML = `
    ${imageUrl ? `<img class="scan-avatar" src="${imageUrl}" alt="ID image" />` : ''}
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