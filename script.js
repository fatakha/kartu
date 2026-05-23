// Daftar placeholder penanda yang kita pasang di dalam file index.html
const PLACEHOLDERS = ["{{NO}}", "{{NO_URUT}}", "{{KELAS}}", "{{NAMA}}", "{{PENGAMPU}}", "{{PENGUJI}}", "{{KET}}"];

// Pengaturan pemetaan default (otomatis mencocokkan jika namanya mirip dengan kolom Excel Anda)
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

// Fungsi utama yang berjalan otomatis saat halaman web dibuka
async function inisialisasiAplikasi() {
  try {
    // Membaca file data.csv yang sudah Anda upload di GitHub
    const response = await fetch('data.csv');
    const dataText = await response.text();
    
    // Memecah teks per baris dan membuang baris yang kosong
    const lines = dataText.split('\n').map(line => line.trim()).filter(line => line !== "");
    
    if (lines.length === 0) {
      document.getElementById('print-area').innerHTML = "<p style='color:red; padding:20px;'>File data.csv kosong atau formatnya salah.</p>";
      return;
    }

    // Deteksi otomatis apakah CSV dipisah menggunakan koma (,) atau titik koma (;)
    const pemisahHeader = lines[0].includes(';') ? ';' : ',';
    csvHeaders = lines[0].split(pemisahHeader).map(h => h.trim());
    
    // Mengonversi data teks mentah menjadi susunan data Array objek
    csvRecords = csvToArray(lines, csvHeaders);
    
    // Membuat komponen pilihan UI Dropdown Mapping secara otomatis
    buatUIMapping();
    
    // Membuat tampilan kartu untuk pertama kalinya
    generateKartu();
  } catch (error) {
    console.error("Gagal memuat data.csv:", error);
    document.getElementById('print-area').innerHTML = "<p style='color:red; padding:20px;'>Gagal memuat file data.csv. Pastikan file data.csv diletakkan di folder utama repositori Anda.</p>";
  }
}

// Fungsi untuk merender/membuat formulir pengaturan di atas halaman web
function buatUIMapping() {
  const formContainer = document.getElementById('mapping-form');
  formContainer.innerHTML = '';
  
  PLACEHOLDERS.forEach(placeholder => {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    const label = document.createElement('label');
    label.innerText = `Tag ${placeholder} -> Hubungkan ke Kolom: `;
    
    const select = document.createElement('select');
    select.id = `map-${placeholder}`;
    
    csvHeaders.forEach(header => {
      const option = document.createElement('option');
      option.value = header;
      option.text = header;
      
      // Jika nama kolom default cocok dengan header Excel, otomatis langsung terpilih
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

// Fungsi yang berjalan ketika Anda mengeklik tombol "Terapkan & Update Tampilan Kartu"
function terapkanMapping() {
  PLACEHOLDERS.forEach(placeholder => {
    const selectElement = document.getElementById(`map-${placeholder}`);
    kunciMapping[placeholder] = selectElement.value;
  });
  
  // Menggambar ulang kartu-kartu berdasarkan setelan baru Anda
  generateKartu();
}

// Fungsi utama "Mail Merge" (Next Record otomatis 6 kartu per halaman)
function generateKartu() {
  let htmlOutput = '<div class="page">';
  let cardCount = 0;
  const kolomCekNama = kunciMapping["{{NAMA}}"];

  csvRecords.forEach((row) => {
    // Abaikan baris jika kolom nama santri kosong
    if (!row[kolomCekNama]) return; 

    // NEXT RECORD: Jika kartu sudah mencapai kelipatan 6, ganti halaman kertas baru (A4)
    if (cardCount > 0 && cardCount % 6 === 0) {
      htmlOutput += '</div><div class="page">';
    }

    // Mengambil cetakan master template dari HTML
    let cardTemplate = document.getElementById('card-template').innerHTML;

    // Proses penggantian otomatis tag {{...}} menjadi data asli dari baris Excel Anda
    for (let [tag, kolomSheet] of Object.entries(kunciMapping)) {
      cardTemplate = cardTemplate.replaceAll(tag, row[kolomSheet] || '');
    }

    // Memasukkan hasil kartu ke kotak cetak
    htmlOutput += `<div class="card-box">${cardTemplate}</div>`;
    cardCount++;
  });

  htmlOutput += '</div>';
  document.getElementById('print-area').innerHTML = htmlOutput;
}

// Fungsi pembantu: Mengubah baris teks CSV menjadi format data siap pakai
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

// Daftarkan fungsi agar langsung menyala saat website selesai loading
window.onload = inisialisasiAplikasi;
