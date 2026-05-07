const codeReader = new ZXing.BrowserMultiFormatReader();
let scanning = false;

async function startScanner() {
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('stop-btn').classList.remove('hidden');
  document.getElementById('result-box').classList.add('hidden');
  scanning = true;

  try {
    const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
    const backCamera = devices.find(d =>
      d.label.toLowerCase().includes('back') ||
      d.label.toLowerCase().includes('rear') ||
      d.label.toLowerCase().includes('environment')
    );
    const deviceId = backCamera ? backCamera.deviceId : devices[devices.length - 1].deviceId;

    await codeReader.decodeFromVideoDevice(deviceId, 'video', (result, err) => {
      if (result && scanning) {
        document.getElementById('result-text').textContent = result.getText();
        document.getElementById('result-format').textContent = 'Format: ' + result.getBarcodeFormat();
        document.getElementById('result-box').classList.remove('hidden');

        navigator.vibrate?.(200);
      }
    });
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