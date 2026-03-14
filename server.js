const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

const app = express();
// Ensuring uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
app.use(cors());

// ── API route ────────────────────────────────────────────────
app.post('/analyze-mri', upload.single('mri-image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imagePath = req.file.path;

    // changed to Python3 for Render compatibility
    const python = spawn('python3', ['predict.py', imagePath]);

    let output = '';
    let errorData = '';

    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { errorData += data.toString(); });

    python.on('close', (code) => {
        if (code !== 0) {
            console.error("--- PYTHON CRASHED ---");
            console.error(errorData);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            return res.status(500).json({ error: 'Prediction failed', details: errorData });
        }

        try {
            const result = JSON.parse(output);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            res.json(result);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            res.status(500).json({ error: 'Failed to parse prediction output' });
        }
    });
});

// ── Serve React build ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});