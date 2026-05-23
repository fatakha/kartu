import pandas as pd
import os

# Cari semua file Excel tanpa peduli huruf besar/kecil ekstensinya
for file in os.listdir('.'):
    if file.lower().endswith('.xlsx'):
        excel_file = file
        print(f"Mengonversi file: {excel_file}")
        
        try:
            xl = pd.ExcelFile(excel_file)
            for sheet_name in xl.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                # Mengubah nama sheet menjadi format aman untuk file CSV
                # Contoh: "Kelas 6A" menjadi "data-kelas_6a.csv"
                safe_sheet_name = sheet_name.replace(" ", "_").lower()
                csv_filename = f"data-{safe_sheet_name}.csv"
                
                df.to_csv(csv_filename, index=False)
                print(f"Berhasil membuat: {csv_filename}")
        except Exception as e:
            print(f"Gagal memproses file {excel_file}: {e}")
