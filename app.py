import os
import json
import logging
from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
app.secret_key = 'cbb4bbcafe1652f607a6cc0c5e79f47c'
CORS(app)

UPLOAD_FOLDER = 'uploads'
COMPRESSED_FOLDER = os.path.join(os.getcwd(), 'compressed_outputs')
PDF_FOLDER = 'pdf_outputs'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)

logging.basicConfig(level=logging.INFO)

# ✅ Enable Cross-Origin Isolation Headers
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"  
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["X-Frame-Options"] = "ALLOWALL"  
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress_image():
    response_data = {"success": False, "message": ""}

    try:
        files = request.files.getlist('images')
        quality = int(request.form.get('quality', 50))  # Adjust compression quality
        crop_coords = request.form.get('crop_coords')  # Get crop coordinates

        if crop_coords:
            crop_coords = json.loads(crop_coords)

        for idx, file in enumerate(files):
            if file.filename == '':
                response_data["message"] = "No selected file"
                continue  # Skip processing if no file selected

            try:
                img = Image.open(file)

                if crop_coords and idx < len(crop_coords):
                    coords = crop_coords[idx]
                    img = img.crop((coords['x'], coords['y'], coords['x'] + coords['width'], coords['y'] + coords['height']))

                compressed_image_path = os.path.join(COMPRESSED_FOLDER, file.filename)
                img.save(compressed_image_path, "JPEG", quality=quality)
                app.logger.info(f"Saved compressed image to {compressed_image_path}")

            except Exception as e:
                response_data["message"] = str(e)
                continue  # Skip and process the next file if an error occurs

        response_data["success"] = True
        response_data["message"] = "Compressed successfully!"
    except Exception as e:
        response_data["message"] = str(e)
        return jsonify(response_data), 500

    return jsonify(response_data)

@app.route('/compressed_images/<filename>')
def get_compressed_image(filename):
    return send_from_directory(COMPRESSED_FOLDER, filename)

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))  # Render provides PORT dynamically
    app.run(host="0.0.0.0", port=port)

