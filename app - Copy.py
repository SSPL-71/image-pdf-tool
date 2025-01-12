import os
import io
from flask import Flask, request, send_file, render_template, redirect, flash
from PIL import Image
from fpdf import FPDF
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

UPLOAD_FOLDER = 'uploads'
COMPRESSED_FOLDER = 'compressed_outputs'
PDF_FOLDER = 'pdf_outputs'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)

SCOPES = ['https://www.googleapis.com/auth/drive.file']
creds = service_account.Credentials.from_service_account_file('service_account_key.json', scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=creds)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress_image():
    if 'images' not in request.files:
        flash("No file part")
        return redirect('/')

    files = request.files.getlist('images')
    quality = int(request.form.get('quality', 50))  # Adjust compression quality

    for file in files:
        if file.filename == '':
            flash("No selected file")
            return redirect('/')
        
        try:
            img = Image.open(file)
            original_size = file.tell()
            print(f"Original size of {file.filename}: {original_size} bytes")

            compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
            img.save(compressed_image_path, "JPEG", quality=quality)

            compressed_size = os.path.getsize(compressed_image_path)
            print(f"Compressed size of {file.filename}: {compressed_size} bytes")

            file_metadata = {'name': file.filename, 'parents': ['your_folder_id_here']}
            media = MediaFileUpload(compressed_image_path, mimetype='image/jpeg')
            drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        except Exception as e:
            flash(str(e))
            return redirect('/')

    flash("Compressed and uploaded successfully!")
    return redirect('/')

@app.route('/convert_to_pdf', methods=['POST'])
def convert_to_pdf():
    if 'images' not in request.files:
        flash("No file part")
        return redirect('/')

    images = request.files.getlist('images')
    quality = int(request.form.get('quality', 50))  # Adjust compression quality

    pdf = FPDF()
    try:
        for file in images:
            if file.filename == '':
                flash("No selected file")
                return redirect('/')
        
            img = Image.open(file)
            compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
            img.save(compressed_image_path, "JPEG", quality=quality)
            pdf.add_page()
            pdf.image(compressed_image_path, x = 10, y = 10, w = 190)
        
        pdf_output_path = os.path.join(PDF_FOLDER, "output.pdf")
        pdf.output(pdf_output_path)
    except Exception as e:
        flash(str(e))
        return redirect('/')

    flash("PDF created successfully!")
    return send_file(pdf_output_path, mimetype='application/pdf')

if __name__ == "__main__":
    app.run(debug=True)
