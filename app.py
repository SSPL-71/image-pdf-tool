import os
import json
from flask import Flask, request, jsonify, redirect, flash, render_template, send_file
from PIL import Image
from fpdf import FPDF

app = Flask(__name__)
app.secret_key = 'cbb4bbcafe1652f607a6cc0c5e79f47c'

UPLOAD_FOLDER = 'uploads'
COMPRESSED_FOLDER = 'compressed_outputs'
PDF_FOLDER = 'pdf_outputs'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress_image():
    response_data = {"success": False, "message": ""}
    
    try:
        if 'images' not in request.files:
            response_data["message"] = "No file part"
            return jsonify(response_data), 400

        files = request.files.getlist('images')
        quality = int(request.form.get('quality', 50))  # Adjust compression quality
        crop_coords = request.form.get('crop_coords')  # Get crop coordinates

        # Confirm parsing of crop coordinates
        if crop_coords:
            try:
                crop_coords = json.loads(crop_coords)
            except Exception as e:
                response_data["message"] = f"Invalid crop coordinates: {e}"
                return jsonify(response_data), 400

        # Log the directories
        print(f"UPLOAD_FOLDER: {UPLOAD_FOLDER}")
        print(f"COMPRESSED_FOLDER: {COMPRESSED_FOLDER}")
        print(f"PDF_FOLDER: {PDF_FOLDER}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Contents of root directory: {os.listdir('.')}")

        for idx, file in enumerate(files):
            if file.filename == '':
                response_data["message"] = "No selected file"
                continue  # Skip processing if no file selected

            try:
                img = Image.open(file)

                # Apply the respective crop if provided
                if crop_coords and idx < len(crop_coords):
                    coords = crop_coords[idx]
                    img = img.crop((coords['x'], coords['y'], coords['x'] + coords['width'], coords['y'] + coords['height']))

                # Save with original filename
                compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
                img.save(compressed_image_path, "JPEG", quality=quality)
                print(f"Saved compressed image to {compressed_image_path}")

            except Exception as e:
                response_data["message"] = str(e)
                continue  # Skip and process the next file if an error occurs

        response_data["success"] = True
        response_data["message"] = "Compressed successfully!"
    except Exception as e:
        response_data["message"] = str(e)
        return jsonify(response_data), 500

    return jsonify(response_data)


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
