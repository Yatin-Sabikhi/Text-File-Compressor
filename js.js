const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileTableBody = document.getElementById('file-table').querySelector('tbody');
let files = [];

// Handle file drop
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('hover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('hover');
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('hover');
    files = Array.from(event.dataTransfer.files);
    updateFileTable();
});

// Handle file input change
fileInput.addEventListener('change', () => {
    files = Array.from(fileInput.files);
    updateFileTable();
});

// Display file details in the table
function updateFileTable() {
    fileTableBody.innerHTML = '';
    files.forEach((file) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${file.name}</td>
            <td>${(file.size / 1024).toFixed(2)} KB</td>
            <td>-</td>
            <td>
                <select>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </td>
        `;

        fileTableBody.appendChild(row);
    });
}

// Simulate file compression process
function compressFiles() {
    if (files.length === 0) {
        alert('Please upload files to compress');
        return;
    }

    files.forEach((file, index) => {
        // Check if the file is a text file
        if (file.type === "text/plain" || file.name.endsWith('.txt')) {
            // Simulate compression (you'll replace this with real backend logic)
            const estimatedSize = (file.size * 0.6).toFixed(2); // Assuming 40% compression

            // Update compressed size in table
            fileTableBody.rows[index].cells[2].textContent = `${(estimatedSize / 1024).toFixed(2)} KB`;

            // Here you would typically convert the text file to binary
            // For demonstration, we'll just log a message
            console.log(`Compressed ${file.name} to binary format. Estimated size: ${estimatedSize / 1024} KB`);
        } else {
            alert(`File ${file.name} is not a text file and will not be compressed.`);
        }
    });

    alert('Text files compressed successfully! Download links would be available here.');
}