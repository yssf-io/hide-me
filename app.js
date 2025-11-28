document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');
    const removeImgBtn = document.getElementById('remove-img');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const secretText = document.getElementById('secret-text');
    const decodedOutput = document.getElementById('decoded-output');
    const canvas = document.getElementById('process-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    let currentImage = null;

    // --- Tab Switching ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panelId = `${tab.dataset.tab}-panel`;
            document.getElementById(panelId).classList.add('active');
        });
    });

    // --- Drag & Drop ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type !== 'image/png') {
            alert('Please upload a PNG image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = new Image();
            currentImage.onload = () => {
                // Set canvas size to match image
                canvas.width = currentImage.width;
                canvas.height = currentImage.height;
                ctx.drawImage(currentImage, 0, 0);

                // Show preview
                previewImg.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
                dropZone.classList.add('hidden'); // Hide drop zone when image is loaded

                // Enable buttons
                encodeBtn.disabled = false;
                decodeBtn.disabled = false;
                decodedOutput.textContent = 'Ready to decode...';
                decodedOutput.classList.add('placeholder');
            };
            currentImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeImgBtn.addEventListener('click', () => {
        currentImage = null;
        fileInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
        encodeBtn.disabled = true;
        decodeBtn.disabled = true;
        decodedOutput.textContent = 'Waiting for image...';
        decodedOutput.classList.add('placeholder');
    });

    // --- Encoding ---
    encodeBtn.addEventListener('click', () => {
        const text = secretText.value;
        if (!text) {
            alert('Please enter some text to hide.');
            return;
        }

        try {
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Encode
            const newImageData = window.Stego.encode(imageData, text);

            // Put modified data back
            ctx.putImageData(newImageData, 0, 0);

            // Create download link using Blob
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'secret_image.png';
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');

            // Reset canvas to original image to prevent double encoding if clicked again
            ctx.drawImage(currentImage, 0, 0);

        } catch (err) {
            alert('Error encoding: ' + err.message);
        }
    });

    // --- Decoding ---
    decodeBtn.addEventListener('click', () => {
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const text = window.Stego.decode(imageData);

            if (text === null) {
                decodedOutput.textContent = 'Error: No valid hidden message found in this image.';
                decodedOutput.classList.add('error'); // You might want to add a red color style for this
            } else {
                decodedOutput.textContent = text;
                decodedOutput.classList.remove('placeholder');
                decodedOutput.classList.remove('error');
            }
        } catch (err) {
            alert('Error decoding: ' + err.message);
        }
    });
});
