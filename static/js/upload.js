let cropperInstances = []; // Array to hold cropper instances
let croppedImagesData = [];
let compressedImagesData = []; // Array to store compressed images data

function previewImages(input, previewContainer) {
    input.addEventListener('change', function() {
        previewContainer.innerHTML = ''; // Clear previous previews
        cropperInstances = []; // Clear previous cropper instances

        const files = input.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgWrap = document.createElement('div');
                imgWrap.classList.add('img-wrap');
                const img = document.createElement('img');
                img.src = e.target.result;
                imgWrap.appendChild(img);
                previewContainer.appendChild(imgWrap);

                // Initialize Cropper.js on the image
                const cropper = new Cropper(img, {
                    aspectRatio: NaN, // Allow free ratio
                    viewMode: 1,
                    autoCropArea: 0.8, // Smaller crop area
                    guides: true,
                    highlight: true,
                    movable: true,
                    zoomable: true,
                    rotatable: true,
                    scalable: true,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    background: false
                });

                cropperInstances.push(cropper); // Add cropper instance to array
            };
            reader.readAsDataURL(file);
        }
    });
}

function cropImages() {
    croppedImagesData = cropperInstances.map(cropper => {
        const canvas = cropper.getCroppedCanvas();
        if (canvas) {
            return canvas.toDataURL('image/jpeg');
        }
        return null;
    }).filter(data => data !== null);

    if (croppedImagesData.length > 0) {
        const imgPreviewCompress = document.getElementById('img-preview-compress');
        imgPreviewCompress.innerHTML = croppedImagesData.map((data, index) => `
            <div class="img-wrap">
                <img src="${data}">
            </div>
        `).join('');

        document.getElementById('compress-box').style.display = 'block';
    } else {
        console.error("No cropped images data.");
    }
}

function compressImages() {
    const quality = document.getElementById('quality').value / 100;
    compressedImagesData = croppedImagesData.map((data, index) => {
        const img = new Image();
        img.src = data;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        return compressedData;
    });

    if (compressedImagesData.length > 0) {
        const imgPreviewPDF = document.getElementById('img-preview-pdf');
        imgPreviewPDF.innerHTML = compressedImagesData.map((data, index) => `
            <div class="img-wrap">
                <img src="${data}">
            </div>
        `).join('');

        document.getElementById('pdf-box').style.display = 'block';

        // Save compressed images to zip
        saveImagesToZip(compressedImagesData, 'Compressed_Images.zip');
    } else {
        console.error("No compressed images data.");
    }
}

function saveImagesToZip(images, filename) {
    const zip = new JSZip();
    images.forEach((data, index) => {
        const imgData = data.split(',')[1];
        zip.file(`image_${index}.jpg`, imgData, {base64: true});
    });

    zip.generateAsync({type: 'blob'}).then(function(content) {
        saveAs(content, filename);
    });
}

function convertToPdf() {
    const filenames = compressedImagesData.map((data, index) => `compressed_image_${index}.jpg`);

    // Logic to convert the selected images to a PDF
    // Ensure that the PDF is saved to the user's Downloads folder
    // or the specified folder

    // Example logic for converting images to PDF
    const pdf = new jsPDF();
    compressedImagesData.forEach((data, index) => {
        const img = new Image();
        img.src = data;
        pdf.addImage(img, 'JPEG', 10, 10 + (index * 20), 180, 160);
    });
    pdf.save('Converted_Images.pdf');
}

document.addEventListener('DOMContentLoaded', function() {
    const cropImagesInput = document.getElementById('cropImages');
    const imgPreviewCrop = document.getElementById('img-preview-crop');
    previewImages(cropImagesInput, imgPreviewCrop);

    const cropButton = document.getElementById('crop-button');
    cropButton.addEventListener('click', cropImages);

    const compressButton = document.getElementById('compress-button');
    compressButton.addEventListener('click', compressImages);

    const pdfButton = document.getElementById('pdf-button');
    pdfButton.addEventListener('click', convertToPdf);
});
