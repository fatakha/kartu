const KEYS = ["kelas", "keterangan", "nama", "no-urut", "penguji", "pengampu"];
const PLACEHOLDERS = ["{{NO}}", "{{NO_URUT}}", "{{KELAS}}", "{{NAMA}}", "{{PENGAMPU}}", "{{PENGUJI}}", "{{KET}}"];

let kunciMapping = {
  "{{NO}}": "No", "{{NO_URUT}}": "No Urut", "{{KELAS}}": "Kelas",
  "{{NAMA}}": "Nama Santri", "{{PENGAMPU}}": "Pengampu", "{{PENGUJI}}": "Penguji", "{{KET}}": "Keterangan"
};

// Ukuran huruf diubah ke % agar proporsional dan tidak bertabrakan lagi
let posisiTeks = {
  "kelas":      { top: 5,  left: 3,  size: 100, width: 25, align: 'left' },
  "keterangan": { top: 5,  left: 72, size: 100, width: 25, align: 'right' },
  "nama":       { top: 56, left: 5,  size: 160, width: 90, align: 'center' }, // Mengecil agar pas di tengah
  "no-urut":    { top: 81, left: 22, size: 100, width: 10, align: 'left' },
  "penguji":    { top: 81, left: 47, size: 100, width: 20, align: 'left' },
  "pengampu":   { top: 81, left: 74, size: 100, width: 20, align: 'left' }
};

let csvRecords = [];
let csvHeaders = [];
let appMode = "preview";

async function inisialisasiAplikasi() {
  try {
    const response = await fetch('data.csv');
    const dataText = await response.text();
    const lines = dataText.split('\n').map(l => l.trim()).filter(l => l !== "");
    
    const pemisahHeader = lines[0].includes(';') ? ';' : ',';
    csvHeaders = lines[0].split(pemisahHeader).map(h => h.trim());
    csvRecords = csvToArray(lines, csvHeaders);
    
    buatUIMapping();
    buatUIPosisi();
    updateTampilan();
  } catch (error) {
    document.getElementById('main-display').innerHTML = "<p style='color:red; padding:20px;'>Gagal memuat data.csv.</p>";
  }
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
    select.onchange = () => { kunciMapping[p] = select.value; updateTampilan(); };
  });
}

function buatUIPosisi() {
  const container = document.getElementById('position-form');
  container.innerHTML = '';
  KEYS.forEach(k => {
    const section = document.createElement('div');
    section.className = 'pos-section';
    section.innerHTML = `
      <h4>Teks: ${k.toUpperCase()}</h4>
      <div class="slider-group">
        <label>Atas (Y): <input type="range" min="0" max="100" value="${posisiTeks[k].top}" oninput="ubahPosisi('${k}', 'top', this.value)"></label>
        <label>Kiri (X): <input type="range" min="0" max="100" value="${posisiTeks[k].left}" oninput="ubahPosisi('${k}', 'left', this.value)"></label>
        <label>Ukuran Huruf (%): <input type="range" min="50" max="300" value="${posisiTeks[k].size}" oninput="ubahPosisi('${k}', 'size', this.value)"></label>
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
  } else {
    document.getElementById('btn-mode-print').classList.add('active-mode');
    document.body.classList.add('print-layout-active');
  }
  updateTampilan();
}

function updateTampilan() {
  const display = document.getElementById('main-display');
  display.innerHTML = '';

  if (csvRecords.length === 0) return;

  if (appMode === "preview") {
    let html = '<div class="preview-container-box">';
    html += buatHtmlKartu(csvRecords[0], "previewmaster");
    html += '</div>';
    display.innerHTML = html;
  } else {
    let html = '<div class="page">';
    let count = 0;
    const keyNama = kunciMapping["{{NAMA}}"];

    csvRecords.forEach((row, index) => {
      if (!row[keyNama]) return;
      // KUNCI UTAMA: Pecah halaman lembar baru setiap 8 KARTU
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
    const elemenList = document.querySelectorAll(`.txt-${k}`);
    elemenList.forEach(el => {
      el.style.top = posisiTeks[k].top + '%';
      el.style.left = posisiTeks[k].left + '%';
      el.style.fontSize = posisiTeks[k].size + '%'; // Menggunakan % agar adaptif mengikuti ukuran kartu
      el.style.width = posisiTeks[k].width + '%';
      el.style.textAlign = posisiTeks[k].align;
    });
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

window.onload = inisialisasiAplikasi;
