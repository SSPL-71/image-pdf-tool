import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@latest/ffmpeg-core.js'
});

document.addEventListener("DOMContentLoaded", async () => {
    const fileInput = document.getElementById("videoFile");
    const qualitySelect = document.getElementById("videoQuality");
    const compressButton = document.getElementById("videocompress-button");
    const previewVideo = document.getElementById("preview-video");
    const downloadLink = document.getElementById("download-video");
    const statusMessage = document.getElementById("video-status");

    // ✅ Load FFmpeg on page load
    async function loadFFmpeg() {
        try {
            if (!ffmpeg.isLoaded()) {
                statusMessage.innerText = "Loading FFmpeg...";
                await ffmpeg.load();
                console.log("FFmpeg loaded successfully!");
                statusMessage.innerText = ""; // Remove message after loading
            }
        } catch (error) {
            console.error("Error loading FFmpeg:", error);
            statusMessage.innerText = "Error loading FFmpeg!";
        }
    }

    await loadFFmpeg();

    compressButton.addEventListener("click", async (event) => {
        event.preventDefault(); // Prevent form submission

        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a video file.");
            return;
        }

        const quality = qualitySelect.value;

        // ✅ Define output quality settings
        let bitrate = "800k"; // Default (Medium)
        if (quality === "low") bitrate = "500k";
        if (quality === "high") bitrate = "1500k";

        try {
            statusMessage.innerText = "Compressing video... Please wait.";
            console.log("Compressing video with bitrate:", bitrate);

            // ✅ Read the file and write it to FFmpeg's virtual filesystem
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

            // ✅ Run FFmpeg compression command
            await ffmpeg.run('-i', 'input.mp4', '-b:v', bitrate, '-vf', 'scale=-2:720', 'output.mp4');

            // ✅ Get the compressed output
            const outputData = ffmpeg.FS('readFile', 'output.mp4');
            console.log("Compressed File Size:", outputData.byteLength, "bytes");

            // ✅ Convert to a Blob and create a preview
            const videoBlob = new Blob([outputData.buffer], { type: 'video/mp4' });
            const videoURL = URL.createObjectURL(videoBlob);

            previewVideo.src = videoURL;
            previewVideo.style.display = "block";
            downloadLink.href = videoURL;
            downloadLink.download = "compressed_video.mp4";
            downloadLink.innerText = "Download Compressed Video";
            downloadLink.style.display = "block";

            statusMessage.innerText = "Compression complete!";
            console.log("Compression successful!");
        } catch (error) {
            console.error("Error during compression:", error);
            statusMessage.innerText = "Compression failed!";
        }
    });
});
