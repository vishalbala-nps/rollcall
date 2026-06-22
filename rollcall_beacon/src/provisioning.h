#pragma once

const char PROVISIONING_HTML[] PROGMEM = R"html(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RollCall Beacon Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f0f0f;
      color: #e8e8e8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
    }

    .logo {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 32px;
    }

    .drop-zone {
      border: 2px dashed #2e2e2e;
      border-radius: 10px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      margin-bottom: 20px;
    }

    .drop-zone:hover, .drop-zone.dragover {
      border-color: #4f8ef7;
      background: #1e2535;
    }

    .drop-zone .icon { font-size: 32px; margin-bottom: 12px; }

    .drop-zone p {
      font-size: 14px;
      color: #777;
    }

    .drop-zone .filename {
      margin-top: 10px;
      font-size: 13px;
      color: #4f8ef7;
      font-family: monospace;
      display: none;
    }

    input[type="file"] { display: none; }

    button {
      width: 100%;
      padding: 12px;
      background: #4f8ef7;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    button:disabled { background: #2a3a5a; color: #555; cursor: default; }
    button:not(:disabled):hover { background: #3a7be0; }

    #status {
      margin-top: 16px;
      font-size: 13px;
      text-align: center;
      color: #555;
      min-height: 20px;
    }

    #status.ok  { color: #4caf50; }
    #status.err { color: #f44336; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">RollCall</div>
    <h1>Beacon Setup</h1>

    <div class="drop-zone" id="dropZone">
      <div class="icon">📄</div>
      <p>Drop your <strong>config.json</strong> here<br/>or click to browse</p>
      <div class="filename" id="filename"></div>
    </div>
    <input type="file" id="fileInput" accept=".json,application/json" />

    <button id="uploadBtn" disabled>Upload Config</button>
    <div id="status"></div>
  </div>

  <script>
    const dropZone  = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const filename  = document.getElementById('filename');
    const status    = document.getElementById('status');
    let selectedFile = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      setFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => setFile(fileInput.files[0]));

    function setFile(file) {
      if (!file) return;
      selectedFile = file;
      filename.textContent = file.name;
      filename.style.display = 'block';
      uploadBtn.disabled = false;
      status.textContent = '';
      status.className = '';
    }

    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile) return;
      const text = await selectedFile.text();
      try {
        JSON.parse(text);
      } catch {
        status.textContent = 'Invalid JSON file.';
        status.className = 'err';
        return;
      }
      uploadBtn.disabled = true;
      status.textContent = 'Uploading...';
      status.className = '';
      try {
        const res = await fetch('/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: text
        });
        if (res.ok) {
          status.textContent = 'Config saved! Beacon is restarting...';
          status.className = 'ok';
        } else {
          status.textContent = 'Upload failed: ' + (await res.text());
          status.className = 'err';
          uploadBtn.disabled = false;
        }
      } catch {
        status.textContent = 'Could not reach beacon.';
        status.className = 'err';
        uploadBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
)html";
