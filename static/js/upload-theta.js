let cropperInstances = [];      
let croppedImagesData = [];     
let originalFilenames = [];     
let compressedImagesData = [];  
let compressionCompleted = false;

// 🔹 Selection logic (max 10 images)
let selectedCount = 0;

document.addEventListener("change", (e) => {
    if (e.target.classList.contains("img-select")) {

        if (e.target.checked) {
            if (selectedCount >= 10) {
                e.target.checked = false;
                alert("You can select only 10 images at a time.");
                return;
            }
            selectedCount++;
        } else {
            selectedCount--;
        }

        updateSelectionCounter();
    }
});

function updateSelectionCounter() {
    const counter = document.getElementById("selection-counter");
    if (counter) {
        counter.textContent = `${selectedCount} / 10 selected`;
    }
}

function deselectAllImages() {
    const checkboxes = document.querySelectorAll(".img-select:not(:disabled)");

    checkboxes.forEach(cb => {
        cb.checked = false;
    });

    selectedCount = 0;
    updateSelectionCounter();
}


// 🔹 Initialize cropper on GenTrac-loaded images
function initializeCropperOn(img, filename = "image.jpg") {
    originalFilenames.push(filename);

    const cropper = new Cropper(img, {
        aspectRatio: NaN,
        viewMode: 1,
        responsive: false,
        autoCropArea: 0.8,
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
            const seHandle = img.parentElement.querySelector('.cropper-point.point-se');
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

    cropperInstances.push(cropper);
}


// 🔹 Crop all GenTrac images
function cropImages() {

    // 🔹 Get selected image indexes
    const selectedIndexes = [...document.querySelectorAll(".img-select:checked")]
        .map(cb => parseInt(cb.dataset.index));

    if (selectedIndexes.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    if (selectedIndexes.length > 10) {
        alert("You can crop only 10 images at a time.");
        return;
    }

    // 🔹 Crop ONLY selected cropper instances
    croppedImagesData = selectedIndexes
        .map(i => {
            const cropper = cropperInstances[i];
            if (!cropper) return null;

            const canvas = cropper.getCroppedCanvas();
            return canvas ? canvas.toDataURL('image/jpeg') : null;
        })
        .filter(Boolean);

    const imgPreviewCompress = document.getElementById('img-preview-compress');
    imgPreviewCompress.innerHTML = croppedImagesData.map(data => `
        <div class="img-wrap"><img src="${data}"></div>
    `).join('');

    document.getElementById('post-compress-choice').style.display = 'none';

// 🔹 Mark selected images as done
selectedIndexes.forEach(i => {
    const wrap = document.querySelector(`img[data-index="${i}"]`).parentElement;

    wrap.classList.add("done");

    // Add badge
    const badge = document.createElement("div");
    badge.className = "done-badge";
    badge.textContent = "✓ Cropped";
    wrap.appendChild(badge);

    // Disable checkbox
    const cb = wrap.querySelector(".img-select");
    if (cb) {
        cb.checked = false;
        cb.disabled = true;
    }
});

// Reset selection counter
selectedCount = 0;
updateSelectionCounter();
}




// 🔹 Compress cropped images
async function compressImages() {
    if (!croppedImagesData.length) return;

    const quality = document.getElementById('quality').value / 100;
    compressedImagesData = [];

    const imgPreviewCompress = document.getElementById('img-preview-compress');
    imgPreviewCompress.innerHTML = '';

    for (let i = 0; i < croppedImagesData.length; i++) {
        const src = croppedImagesData[i];

        const compressedItem = await new Promise(resolve => {
            const img = new Image();
            img.onload = function () {
    
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                resolve({
                    data: dataUrl,
                    fileName: originalFilenames[i] || `image_${i + 1}.jpg`
                });
            };
            img.src = src;
        });

        compressedImagesData.push(compressedItem);
    }

    compressionCompleted = true;

    imgPreviewCompress.innerHTML = compressedImagesData.map(item => `
        <div class="img-wrap"><img src="${item.data}"></div>
    `).join('');

    document.getElementById('post-compress-choice').style.display = 'block';
}


// 🔹 Download compressed images
function proceedToPdf() {

console.log("proceedToPdf called");
    const imgPreviewPdf = document.getElementById('img-preview-pdf');

    imgPreviewPdf.innerHTML = compressedImagesData.map(item => `
        <div class="img-wrap img-sortable">
            <img src="${item.data}">
        </div>
    `).join('');

    if (imgPreviewPdf._sortable) {
        imgPreviewPdf._sortable.destroy();
    }

    imgPreviewPdf._sortable = new Sortable(imgPreviewPdf, {
        animation: 150
    });
}


// 🔹 Move compressed images to PDF stage
function proceedToPdf() {
    const imgPreviewPdf = document.getElementById('img-preview-pdf');

    imgPreviewPdf.innerHTML = compressedImagesData.map(item => `
        <div class="img-wrap img-sortable">
            <img src="${item.data}">
        </div>
    `).join('');

    new Sortable(imgPreviewPdf, {
        animation: 150
    });
}


// 🔹 Convert images to PDF
async function convertToPdf() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const previewContainer = document.getElementById("img-preview-pdf");
    const imageElements = previewContainer.querySelectorAll(".img-wrap img");
    const sources = Array.from(imageElements).map(img => img.src);

    if (!sources.length) return;

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < sources.length; i++) {
        await new Promise(resolve => {
            const img = new Image();

            img.onload = function () {

                let w = img.width;
                let h = img.height;
                const ratio = w / h;

                if (w > pageWidth) {
                    w = pageWidth;
                    h = w / ratio;
                }
                if (h > pageHeight) {
                    h = pageHeight;
                    w = h * ratio;
                }

                const x = (pageWidth - w) / 2;
                const y = (pageHeight - h) / 2;

                if (i > 0) pdf.addPage();
                pdf.addImage(img, 'JPEG', x, y, w, h);

                resolve();
            };
            img.src = sources[i];

        });
    }

    // 🔹 ONLY THIS LINE CHANGED


// Show spinner
document.getElementById("case-loading-overlay").style.display = "flex";

const pdfBlob = pdf.output("blob");

const formData = new FormData();
formData.append("file", pdfBlob, "Converted_Images.pdf");

try {
    const response = await fetch(
        `https://gentrac.onrender.com/api/drive/cases/${window.selectedCaseId}/upload-pdf`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${window.THETA_TOKEN}`
            },
            body: formData
        }
    );

    // Hide spinner
    document.getElementById("case-loading-overlay").style.display = "none";

    // Show success toast
    showPdfSuccessToast();

    const result = await response.text();

} catch (err) {
    document.getElementById("case-loading-overlay").style.display = "none";
    alert("Upload failed: " + err);
}


}

function showPdfSuccessToast() {
    const toast = document.getElementById("pdf-toast");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// 🔹 Wire up buttons
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('crop-button').addEventListener('click', cropImages);
    document.getElementById('compress-button').addEventListener('click', compressImages);
    document.getElementById('download-compressed-btn').addEventListener('click', downloadCompressedImages);
    document.getElementById('proceed-to-pdf-btn').addEventListener('click', proceedToPdf);
    document.getElementById('pdf-button').addEventListener('click', convertToPdf);
document.getElementById('deselect-all-btn').addEventListener('click', deselectAllImages);
});
