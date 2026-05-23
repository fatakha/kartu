import pandas as pd
import os

# Cari semua file .xlsx di folder utama
for file in os.listdir('.'):
    if file.endswith('.xlsx'):
        excel_file = file
        print(f"Mengonversi file: {excel_file}")
        
        # Baca semua sheet yang ada di dalam file Excel
        xl = pd.ExcelFile(excel_file)
        for sheet_name in xl.sheet_names:
            # Baca data per sheet
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # Bersihkan nama sheet agar aman jadi nama file (ganti spasi dengan underscore)
            safe_sheet_name = sheet_name.replace(" ", "_").lower()
            csv_filename = f"data-{safe_sheet_name}.csv"
            
            # Simpan menjadi file CSV
            df.to_csv(csv_filename, index=False)
            print(f"Berhasil membuat: {csv_filename}")
