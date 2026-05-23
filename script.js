// Placeholder yang kita gunakan di dalam kode HTML template
const PLACEHOLDERS = ["{{NO}}", "{{NO_URUT}}", "{{KELAS}}", "{{NAMA}}", "{{PENGAMPU}}", "{{PENGUJI}}", "{{KET}}"];

// Mapping default awal (jika namanya pas dengan Excel Anda)
let kunciMapping = {
  "{{NO}}": "No",
  "{{NO_URUT}}": "No Urut",
  "{{KELAS}}": "Kelas",
  "{{NAMA}}": "Nama Santri",
  "{{PENGAMPU}}": "Pengampu",
  "{{PENGUJI}}": "Penguji",
  "{{KET}}": "Keterangan"
};

let csvRecords = [];
let csvHeaders = [];

async function inisialisasiAplikasi() {
  try {
    const response = await fetch('data.csv');
    const dataText = await response.text();
    
    // Pecah data CSV
    const lines = dataText.split('\n').map(line => line.trim()).filter(line => line !== "");
    csvHeaders = lines[0].split(',').map(h => h.trim());
    
    // Simpan semua baris data ke variabel global
    csvRecords = csvToArray(lines, csvHeaders);
    
    // Buat komponen UI Pengaturan secara otomatis berdasarkan header CSV yang ada
    buatUIMapping();
    
    // Generate kartu pertama kali
    generateKartu();
  } catch (error) {
    console.error("Gagal memuat data.csv:", error);
    document.getElementById('print-area').innerHTML = "<p style='color:red; padding:20px;'>Gagal memuat data.csv. Pastikan file data.csv sudah di-upload di folder yang sama.</p>";
  }
}

// Fungsi membuat form UI dropdown
function buatUIMapping() {
  const formContainer = document.getElementById('mapping-form');
  formContainer.innerHTML = '';
  
  PLACEHOLDERS.forEach(placeholder => {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    // Label nama tag template
    const label = document.createElement('label');
    label.innerText = `Tag ${placeholder} : `;
    
    // Dropdown pilihan kolom dari CSV
    const select = document.createElement('select');
    select.id = `map-${placeholder}`;
    
    csvHeaders.forEach(header => {
      const option = document.createElement('option');
      option.value = header;
      option.text = header;
      // Otomatis pilih jika nama mapping default cocok atau mendekati
      if (kunciMapping[placeholder] === header) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    row.appendChild(label);
    row.appendChild(select);
    formContainer.appendChild(row);
  });
}

// Fungsi saat tombol "Terapkan" diklik oleh user
function terapkanMapping() {
  PLACEHOLDERS.forEach(placeholder => {
    const selectElement = document.getElementById(`map-${placeholder}`);
    kunciMapping[placeholder] = selectElement.value;
  });
  
  // Generate ulang kartu setelah mapping diubah
  generateKartu();
}

// Fungsi utama mail merge (looping next record)
function generateKartu() {
  let htmlOutput = '<div class="page">';
  let cardCount = 0;
  const targetCekHeader = kunciMapping["{{NAMA}}"];

  csvRecords.forEach((row) => {
    if (!row[targetCekHeader]) return; // Abaikan jika baris kosong

    // Pindah halaman kertas setiap 6 kartu
    if (cardCount > 0 && cardCount % 6 === 0) {
      htmlOutput += '</div><div class="page">';
    }

    let cardTemplate = document.getElementById('card-template').innerHTML;

    // Proses penggantian data berdasarkan mapping dari UI dropdown
    for (let [tag, kolomSheet] of Object.entries(kunciMapping)) {
      cardTemplate = cardTemplate.replaceAll(tag, row[kolomSheet] || '');
    }

    htmlOutput += `<div class="card-box">${cardTemplate}</div>`;
    cardCount++;
  });

  htmlOutput += '</div>';
  document.getElementById('print-area').innerHTML = htmlOutput;
}

function csvToArray(lines, headers) {
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].split(',');
    if (currentline.length < headers.length) continue;
    
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j].trim();
    }
    result.push(obj);
  }
  return result;
}

window.onload = inisialisasiAplikasi;
