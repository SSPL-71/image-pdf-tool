document.getElementById('imageInput').addEventListener('change', function(event) {
    const files = event.target.files;
    const compressedFiles = [];

    Array.from(files).forEach(file => {
        new Compressor(file, {
            quality: 0.6,  // Adjust quality as needed
            success(result) {
                compressedFiles.push(result);
            },
            error(err) {
                console.log(err.message);
            }
        });
    });

    window.compressedFiles = compressedFiles;
});

function uploadImages() {
    const formData = new FormData();

    window.compressedFiles.forEach(file => {
        formData.append('images', file, file.name);
    });

    const cropCoords = {
        x: document.getElementById('x').value,
        y: document.getElementById('y').value,
        width: document.getElementById('width').value,
        height: document.getElementById('height').value,
    };

    formData.append('crop_coords', JSON.stringify(cropCoords));

    fetch('/compress', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Images uploaded and compressed successfully!');
        } else {
            alert('Failed to upload images: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

function convertToPdf() {
    const filenames = window.compressedFiles.map(file => file.name);

    fetch('/convert_to_pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filenames: filenames })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.open(data.pdf_url);
        } else {
            alert('Failed to convert images to PDF: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    // Step 1: Crop Images
    const cropImagesInput = document.getElementById('cropImages');
    const imgPreviewCrop = document.getElementById('img-preview-crop');
    previewImages(cropImagesInput, imgPreviewCrop);

    const cropButton = document.getElementById('crop-button');
    cropButton.addEventListener('click', cropImages);

    // Step 2: Compress Images
    const compressButton = document.getElementById('compress-button');
    compressButton.addEventListener('click', compressImages);
});
