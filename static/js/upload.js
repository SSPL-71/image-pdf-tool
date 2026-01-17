let cropperInstances = [];      // Array to hold cropper instances
let croppedImagesData = [];     // Array to store data URIs of cropped images
let originalFilenames = [];     // Array to store original filenames
let compressedImagesData = [];  // Array to store compressed images (data URL + filename)
let compressionCompleted = false;


// Preview & init croppers
function previewImages(input, previewContainer) {
    input.addEventListener('change', function () {
        previewContainer.innerHTML = ''; // Clear previous previews
        cropperInstances = [];           // Clear previous cropper instances
        originalFilenames = [];          // Clear previous filenames
        croppedImagesData = [];
        compressedImagesData = [];
       compressionCompleted = false; // ✅ ADD THIS LINE

        const files = input.files;
        for (const file of files) {
            originalFilenames.push(file.name); // Save original filename
            const reader = new FileReader();
            reader.onload = function (e) {
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
                    responsive: false,
                    autoCropArea: 0.8, // Smaller crop area
                    guides: true,
                    highlight: true,
                    movable: true,
                    zoomable: true,
                    rotatable: true,
                    scalable: true,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    background: false,
                    ready() {
                        // Patch the orange handle (SE)
                        const seHandle = imgWrap.querySelector('.cropper-point.point-se');
                        if (seHandle) {
                            const orangeHorizontal = document.createElement('div');
                            orangeHorizontal.style.position = 'absolute';
                            orangeHorizontal.style.width = '16px';
                            orangeHorizontal.style.height = '4px';
                            orangeHorizontal.style.backgroundColor = '#ff9800';
                            orangeHorizontal.style.bottom = '0';
                            orangeHorizontal.style.right = '0';
                            orangeHorizontal.style.zIndex = '1';
                            orangeHorizontal.style.pointerEvents = 'none';
                            seHandle.appendChild(orangeHorizontal);
                        }
                    }
                });

                cropperInstances.push(cropper); // Add cropper instance to array
            };
            reader.readAsDataURL(file);
        }
    });
}

// Get cropped images from all croppers and show preview
function cropImages() {
    croppedImagesData = cropperInstances
        .map(cropper => {
            const canvas = cropper.getCroppedCanvas();
            if (canvas) {
                return canvas.toDataURL('image/jpeg');
            }
            return null;
        })
        .filter(data => data !== null);

    if (croppedImagesData.length > 0) {
        const imgPreviewCompress = document.getElementById('img-preview-compress');
        imgPreviewCompress.innerHTML = croppedImagesData.map((data) => `
            <div class="img-wrap">
                <img src="${data}">
            </div>
        `).join('');

        document.getElementById('compress-box').style.display = 'block';
    } else {
        console.error("No cropped images data.");
    }
}

// Download helper
function saveAsFile(content, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Compress cropped images, download JPEGs, and prepare for PDF
// Compress cropped images and show decision options
async function compressImages() {
    if (!croppedImagesData.length) {
        console.error("No cropped images to compress.");
        return;
    }

    const quality = document.getElementById('quality').value / 100;
    compressedImagesData = [];

    const imgPreviewCompress = document.getElementById('img-preview-compress');
    imgPreviewCompress.innerHTML = '';

    for (let i = 0; i < croppedImagesData.length; i++) {
        const src = croppedImagesData[i];

        const compressedItem = await new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                resolve({
                    data: dataUrl,
                    fileName: originalFilenames[i]
                });
            };
            img.src = src;
        });

        compressedImagesData.push(compressedItem);
    }

    compressionCompleted = true;

document.getElementById('post-compress-choice').style.display = 'block';


    // Update compressed preview
    imgPreviewCompress.innerHTML = compressedImagesData.map(item => `
        <div class="img-wrap">
            <img src="${item.data}">
        </div>
    `).join('');

    // 🔑 Show decision UI AFTER compression
    const decisionBox = document.getElementById('download-option');
    if (decisionBox) {
        decisionBox.style.display = 'block';
    }
}

// Download all compressed images
function downloadCompressedImages() {
    if (!compressedImagesData.length) return;

    compressedImagesData.forEach((item) => {
        const blob = fetch(item.data).then(res => res.blob());
        blob.then(b => saveAsFile(b, item.fileName));
    });
}

// Move compressed images to PDF preview area
function proceedToPdf() {
    if (!compressedImagesData.length) return;

    const imgPreviewPdf = document.getElementById('img-preview-pdf');
    imgPreviewPdf.innerHTML = compressedImagesData.map(item => `
        <div class="img-wrap">
            <img src="${item.data}">
        </div>
    `).join('');
}


// Convert (compressed) images to PDF with correct sizing
async function convertToPdf() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(); // keep default settings
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Always respect user sorting in PDF preview
const previewContainer = document.getElementById("img-preview-pdf");
if (!previewContainer) {
    console.error("PDF preview container not found.");
    return;
}

const imageElements = previewContainer.querySelectorAll(".img-wrap img");
const sources = Array.from(imageElements).map(img => img.src);

if (!sources.length) {
    console.error("No images found for PDF conversion.");
    return;
}


    // Process sequentially to preserve order
    for (let i = 0; i < sources.length; i++) {
        const src = sources[i];

        await new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                let imgWidth = img.width;
                let imgHeight = img.height;
                const aspectRatio = imgWidth / imgHeight;

                // Fit image into page while maintaining aspect ratio
                if (imgWidth > pageWidth) {
                    imgWidth = pageWidth;
                    imgHeight = imgWidth / aspectRatio;
                }

                if (imgHeight > pageHeight) {
                    imgHeight = pageHeight;
                    imgWidth = imgHeight * aspectRatio;
                }

                // Center image on page
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
                resolve();
            };
            img.src = src;
        });
    }

    pdf.save('Converted_Images.pdf');
}

// Hook up DOM on load
document.addEventListener('DOMContentLoaded', function () {
    const cropImagesInput = document.getElementById('cropImages');
    const imgPreviewCrop = document.getElementById('img-preview-crop');
    previewImages(cropImagesInput, imgPreviewCrop);

    const cropButton = document.getElementById('crop-button');
    cropButton.addEventListener('click', cropImages);

    const compressButton = document.getElementById('compress-button');
    compressButton.addEventListener('click', compressImages);

document.getElementById('download-compressed-btn')
  ?.addEventListener('click', downloadCompressedImages);

document.getElementById('proceed-to-pdf-btn')
  ?.addEventListener('click', proceedToPdf);


    const pdfButton = document.getElementById('pdf-button');
    pdfButton.addEventListener('click', convertToPdf);
});
