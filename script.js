// ====== FITUR MAPPING DATA SANTRI ======
const KUNCI_MAPPING = {
  "{{NO}}": "No",
  "{{NO_URUT}}": "No Urut",
  "{{KELAS}}": "Kelas",
  "{{NAMA}}": "Nama Santri",
  "{{PENGAMPU}}": "Pengampu",
  "{{PENGUJI}}": "Penguji",
  "{{KET}}": "Keterangan"
};

// Fungsi otomatis membaca CSV dan melakukan "Next Record" per 6 kartu
async function loadMailMerge() {
  try {
    const response = await fetch('data.csv');
    const dataText = await response.text();
    const records = csvToArray(dataText);
    
    let htmlOutput = '<div class="page">';
    let cardCount = 0;

    records.forEach((row) => {
      // Abaikan jika baris kosong
      if (!row["Nama Santri"]) return; 

      // Setiap mencapai 6 kartu, tutup halaman lama dan buka halaman baru
      if (cardCount > 0 && cardCount % 6 === 0) {
        htmlOutput += '</div><div class="page">';
      }

      // Ambil master template desain dari HTML
      let cardTemplate = document.getElementById('card-template').innerHTML;

      // PROSES MAPPING OTOMATIS
      for (let [tag, kolomSheet] of Object.entries(KUNCI_MAPPING)) {
        cardTemplate = cardTemplate.replaceAll(tag, row[kolomSheet] || '');
      }

      // Masukkan kartu ke dalam grid halaman
      htmlOutput += `<div class="card-box">${cardTemplate}</div>`;
      cardCount++;
    });

    htmlOutput += '</div>';
    document.getElementById('print-area').innerHTML = htmlOutput;
  } catch (error) {
    console.error("Gagal memuat data CSV:", error);
  }
}

// Fungsi sederhana pengubah teks CSV menjadi Array of Objects
function csvToArray(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
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

window.onload = loadMailMerge;
