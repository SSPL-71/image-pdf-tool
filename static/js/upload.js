let cropperInstances = []; // Array to hold cropper instances
let croppedImagesData = []; // Array to store data URIs of cropped images
let originalFilenames = []; // Array to store original filenames

function previewImages(input, previewContainer) {
    input.addEventListener('change', function() {
        previewContainer.innerHTML = ''; // Clear previous previews
        cropperInstances = []; // Clear previous cropper instances
        originalFilenames = []; // Clear previous filenames

        const files = input.files;
        for (const file of files) {
            originalFilenames.push(file.name); // Save original filename
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
function saveAsFile(content, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = fileName;
    link.click();
}

async function compressImages() {
    const quality = document.getElementById('quality').value / 100;
    compressedImagesData = croppedImagesData.map((data, index) => {
        const img = new Image();
        img.src = data;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        canvas.toBlob((blob) => {
            saveAsFile(blob, originalFilenames[index]);
        }, 'image/jpeg', quality);
        return {
            data: canvas.toDataURL('image/jpeg', quality),
            fileName: originalFilenames[index]
        };
    });

    if (compressedImagesData.length > 0) {
        document.getElementById('pdf-box').style.display = 'block';
    } else {
        console.error("No compressed images data.");
    }
}

function convertToPdf() {
    const previewContainer = document.getElementById("img-preview-pdf");
    const imageElements = previewContainer.querySelectorAll(".img-wrap img");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let yPosition = 0;
    let processedCount = 0;

    const imageArray = Array.from(imageElements);

    imageArray.forEach((imgElement, index) => {
        const img = new Image();
        img.src = imgElement.src;
        img.onload = function () {
            let imgWidth = img.width;
            let imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;

            if (imgWidth > pageWidth || imgHeight > pageHeight) {
                if (aspectRatio > 1) {
                    imgWidth = pageWidth;
                    imgHeight = pageWidth / aspectRatio;
                } else {
                    imgWidth = pageHeight * aspectRatio;
                    imgHeight = pageHeight;
                }
            }

            if (yPosition + imgHeight > pageHeight) {
                pdf.addPage();
                yPosition = 0;
            }

            pdf.addImage(img, 'JPEG', (pageWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight;

            processedCount++;
            if (processedCount === imageArray.length) {
                pdf.save('Converted_Images.pdf');
            }
        }
    });
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
