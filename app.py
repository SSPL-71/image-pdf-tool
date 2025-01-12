import os
import io
import json
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
    crop_coords = request.form.get('crop_coords')  # Get crop coordinates

    # Confirm parsing of crop coordinates
    if crop_coords:
        try:
            crop_coords = json.loads(crop_coords)
        except Exception as e:
            flash(f"Invalid crop coordinates: {e}")
            return redirect('/')

    for idx, file in enumerate(files):
        if file.filename == '':
            flash("No selected file")
            continue  # Skip processing if no file selected

        try:
            img = Image.open(file)

            # Apply the respective crop if provided
            if crop_coords and idx < len(crop_coords):
                coords = crop_coords[idx]
                img = img.crop((coords['x'], coords['y'], coords['x'] + coords['width'], coords['y'] + coords['height']))
            
            compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
            img.save(compressed_image_path, "JPEG", quality=quality)

            file_metadata = {'name': file.filename, 'parents': ['your_folder_id_here']}
            media = MediaFileUpload(compressed_image_path, mimetype='image/jpeg')
            drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        except Exception as e:
            flash(str(e))
            continue  # Skip and process the next file if an error occurs

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
                continue  # Skip processing if no file selected

            compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
            img = Image.open(compressed_image_path)  # Open compressed image
            pdf.add_page()
            pdf.image(compressed_image_path, x=10, y=10, w=190)
        
        pdf_output_path = os.path.join(PDF_FOLDER, "output.pdf")
        pdf.output(pdf_output_path)
    except Exception as e:
        flash(str(e))
        return redirect('/')

    flash("PDF created successfully!")
    return send_file(pdf_output_path, mimetype='application/pdf')

if __name__ == "__main__":
    app.run(debug=True)
