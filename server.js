const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');

app.use(cors());
// 1. Configure storage to keep extensions
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        // Generate a unique name + the original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); 
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// 2. Use the new storage engine
const upload = multer({ storage: storage });

const app = express();

app.post('/analyze-mri', upload.single('mri-image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imagePath = req.file.path;

    //spawn process
    const python = spawn('./brain_tumor_env/bin/python', ['predict.py', imagePath]);

    let output = '';
    let errorData = ''; // to catch error output from Python
    python.stdout.on('data', (data) => {
        output += data.toString();
    });
    // THIS IS THE KEY: It captures why Python is crashing
    python.stderr.on('data', (data) => { errorData += data.toString(); });


python.on('close', (code) => {
        // 1. Check for crash first
        if (code !== 0) {
            console.error("--- PYTHON CRASHED ---");
            console.error(errorData);
            // Clean up image even if it failed
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            return res.status(500).json({ error: 'Prediction failed', details: errorData });
        }

        // 2. Try to parse successful output
        try {
            const result = JSON.parse(output);
            // Delete image after successful processing
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            res.json(result);
        }
        catch (e) {
            console.error("JSON Parse Error:", e);
            res.status(500).json({ error: 'Failed to parse prediction output' });
        }
    });
});
app.listen(3000, () => {
    console.log('Server running on port 3000');
});