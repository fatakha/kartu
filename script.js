const KEYS = ["kelas", "keterangan", "nama", "no-urut", "penguji", "pengampu"];
const PLACEHOLDERS = ["{{NO}}", "{{NO_URUT}}", "{{KELAS}}", "{{NAMA}}", "{{PENGAMPU}}", "{{PENGUJI}}", "{{KET}}"];

// Default awal jika file settings.json belum ada di GitHub Anda
let kunciMapping = {
  "{{NO}}": "No", "{{NO_URUT}}": "No Urut", "{{KELAS}}": "Kelas",
  "{{NAMA}}": "Nama Santri", "{{PENGAMPU}}": "Pengampu", "{{PENGUJI}}": "Penguji", "{{KET}}": "Keterangan"
};

let posisiTeks = {
  "kelas":      { top: 5,  left: 3,  size: 100, width: 25, align: 'left' },
  "keterangan": { top: 5,  left: 72, size: 100, width: 25, align: 'right' },
  "nama":       { top: 48, left: 5,  size: 155, width: 90, align: 'center' },
  "no-urut":    { top: 81, left: 22, size: 100, width: 10, align: 'left' },
  "penguji":    { top: 81, left: 47, size: 100, width: 20, align: 'left' },
  "pengampu":   { top: 81, left: 74, size: 100, width: 20, align: 'left' }
};

let csvRecords = [];
let csvHeaders = [];
let appMode = "preview";
let kelasTerfilter = "SEMUA";

async function inisialisasiAplikasi() {
  // 1. Ambil settingan mapping & posisi yang tersimpan di GitHub dahulu
  try {
    const configResponse = await fetch('settings.json');
    if (configResponse.ok) {
      const configData = await configResponse.json();
      if (configData.kunciMapping) kunciMapping = configData.kunciMapping;
      if (configData.posisiTeks) posisiTeks = configData.posisiTeks;
      document.getElementById('sync-status').className = "sync-info sync-success";
      document.getElementById('sync-status').innerHTML = "✅ Konfigurasi berhasil dimuat dari GitHub (settings.json)";
    } else {
      document.getElementById('sync-status').className = "sync-info sync-warning";
      document.getElementById('sync-status').innerHTML = "⚠️ Menggunakan settingan bawaan (Belum ada file settings.json)";
    }
  } catch (e) {
    document.getElementById('sync-status').className = "sync-info sync-warning";
    document.getElementById('sync-status').innerHTML = "⚠️ Menggunakan settingan bawaan.";
  }

  // 2. Memuat data CSV utama
  try {
    const response = await fetch('data.csv');
    const dataText = await response.text();
    const lines = dataText.split('\n').map(l => l.trim()).filter(l => l !== "");
    
    const pemisahHeader = lines[0].includes(';') ? ';' : ',';
    csvHeaders = lines[0].split(pemisahHeader).map(h => h.trim());
    csvRecords = csvToArray(lines, csvHeaders);
    
    buatUIMapping();
    buatUIPosisi();
    perbaruiOpsiFilterKelas();
    updateTampilan();
  } catch (error) {
    document.getElementById('main-display').innerHTML = "<p style='color:red; padding:20px;'>Gagal memuat data.csv. Pastikan file data.csv sudah diupload ke GitHub.</p>";
  }
}

function perbaruiOpsiFilterKelas() {
  const selectFilter = document.getElementById('filter-kelas');
  const kolomKelas = kunciMapping["{{KELAS}}"];
  let daftarKelas = new Set();
  
  csvRecords.forEach(row => {
    if (row[kolomKelas]) daftarKelas.add(row[kolomKelas].trim());
  });

  selectFilter.innerHTML = '<option value="SEMUA">-- Tampilkan Semua Kelas --</option>';
  Array.from(daftarKelas).sort().forEach(namaKelas => {
    let opt = new Option(namaKelas, namaKelas);
    selectFilter.add(opt);
  });
}

function gantiFilterKelas() {
  kelasTerfilter = document.getElementById('filter-kelas').value;
  updateTampilan();
}

function buatUIMapping() {
  const container = document.getElementById('mapping-form');
  container.innerHTML = '';
  PLACEHOLDERS.forEach(p => {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML = `<label>${p} :</label><select id="map-${p}"></select>`;
    container.appendChild(row);
    
    const select = document.getElementById(`map-${p}`);
    csvHeaders.forEach(h => {
      let opt = new Option(h, h, false, kunciMapping[p] === h);
      select.add(opt);
    });
    select.onchange = () => { 
      kunciMapping[p] = select.value; 
      if (p === "{{KELAS}}") perbaruiOpsiFilterKelas();
      updateTampilan(); 
    };
  });
}

function buatUIPosisi() {
  const container = document.getElementById('position-form');
  container.innerHTML = '';
  KEYS.forEach(k => {
    let labelNama = k === 'nama' ? 'Tinggi Poros (Y)' : 'Atas (Y)';
    const section = document.createElement('div');
    section.className = 'pos-section';
    section.innerHTML = `
      <h4>TEKS: ${k.toUpperCase()}</h4>
      <div class="slider-group">
        <label>${labelNama}: <input type="range" min="0" max="100" value="${posisiTeks[k].top}" oninput="ubahPosisi('${k}', 'top', this.value)"></label>
        <label>Kiri (X): <input type="range" min="0" max="100" value="${posisiTeks[k].left}" oninput="ubahPosisi('${k}', 'left', this.value)"></label>
        <label>Ukuran (%): <input type="range" min="50" max="300" value="${posisiTeks[k].size}" oninput="ubahPosisi('${k}', 'size', this.value)"></label>
      </div>
    `;
    container.appendChild(section);
  });
}

function ubahPosisi(item, properti, nilai) {
  posisiTeks[item][properti] = parseInt(nilai);
  terapkanGayaCSSKonstan();
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).style.display = 'block';
  document.getElementById(`btn-tab-${tabName}`).classList.add('active');
}

function setMode(mode) {
  appMode = mode;
  document.querySelectorAll('.panel-actions button').forEach(b => b.classList.remove('active-mode'));
  if(mode === 'preview') {
    document.getElementById('btn-mode-preview').classList.add('active-mode');
    document.body.classList.remove('print-layout-active');
    document.getElementById('btn-download-pdf').style.display = 'none';
  } else {
    document.getElementById('btn-mode-print').classList.add('active-mode');
    document.body.classList.add('print-layout-active');
    document.getElementById('btn-download-pdf').style.display = 'inline-block';
  }
  updateTampilan();
}

function updateTampilan() {
  const display = document.getElementById('main-display');
  display.innerHTML = '';

  if (csvRecords.length === 0) return;

  const keyNama = kunciMapping["{{NAMA}}"];
  const keyKelas = kunciMapping["{{KELAS}}"];

  let dataTerfilter = csvRecords.filter(row => {
    if (!row[keyNama]) return false;
    if (kelasTerfilter !== "SEMUA" && row[keyKelas] !== kelasTerfilter) return false;
    return true;
  });

  if (dataTerfilter.length === 0) {
    display.innerHTML = "<p style='padding:20px; text-align:center; color:#64748b;'>Tidak ada data santri untuk kelas ini.</p>";
    return;
  }

  if (appMode === "preview") {
    let html = '<div class="preview-container-box">';
    html += buatHtmlKartu(dataTerfilter[0], "previewmaster");
    html += '</div>';
    display.innerHTML = html;
  } else {
    let html = '<div class="page">';
    let count = 0;

    dataTerfilter.forEach((row, index) => {
      if (count > 0 && count % 8 === 0) html += '</div><div class="page">';
      html += `<div class="card-box">${buatHtmlKartu(row, index)}</div>`;
      count++;
    });
    html += '</div>';
    display.innerHTML = html;
  }
  terapkanGayaCSSKonstan();
}

function buatHtmlKartu(row, id) {
  let template = document.getElementById('card-template').innerHTML;
  template = template.replaceAll('{{ID}}', id);
  for (let [tag, kolom] of Object.entries(kunciMapping)) {
    template = template.replaceAll(tag, row[kolom] || '');
  }
  return template;
}

function terapkanGayaCSSKonstan() {
  KEYS.forEach(k => {
    if (k === 'nama') {
      const boxList = document.querySelectorAll(`.txt-nama`);
      boxList.forEach(box => {
        box.style.top = posisiTeks[k].top + '%';
        box.style.left = posisiTeks[k].left + '%';
        box.style.width = posisiTeks[k].width + '%';
        box.style.fontSize = posisiTeks[k].size + '%';
      });
    } else {
      const elemenList = document.querySelectorAll(`.txt-${k}`);
      elemenList.forEach(el => {
        el.style.top = posisiTeks[k].top + '%';
        el.style.left = posisiTeks[k].left + '%';
        el.style.fontSize = posisiTeks[k].size + '%';
        el.style.width = posisiTeks[k].width + '%';
        el.style.textAlign = posisiTeks[k].align;
      });
    }
  });
}

function csvToArray(lines, headers) {
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const pemisah = lines[i].includes(';') ? ';' : ',';
    const currentline = lines[i].split(pemisah);
    if (currentline.length < headers.length) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
    }
    result.push(obj);
  }
  return result;
}

// FUNGSI EKSPOR SETTINGAN KE FILE JSON
function simpanKeJSON() {
  const dataKonfigurasi = {
    kunciMapping: kunciMapping,
    posisiTeks: posisiTeks
  };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataKonfigurasi, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "settings.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  alert("File 'settings.json' berhasil diunduh!\n\nSilakan upload file ini ke akun GitHub Anda di dalam folder yang sama dengan index.html agar tersimpan permanen.");
}

function unduhPDF() {
  window.print();
}

window.onload = inisialisasiAplikasi;
