const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Password Admin (Sesuai request sebelumnya)
const ADMIN_PASSWORD = "822010";
const SECRET_TOKEN = "ACCESS-GRANTED-NEUNOVAL-SECURE-V3";

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Folder & DB
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const DB_FILE = path.join(__dirname, 'apps.json');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Sanitasi nama aplikasi (Gunakan 'default' jika belum ada)
        let appName = req.body.name ? req.body.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'unknown_app';
        
        // Tentukan subfolder berdasarkan tipe field
        let subfolder = '';
        if (file.fieldname === 'appLogo') subfolder = 'icons';
        else if (file.fieldname === 'screenshot') subfolder = 'screenshots';
        else subfolder = 'app'; // Untuk file binary (android, windows, dll)

        const targetDir = path.join(__dirname, 'uploads', appName, subfolder);
        
        // Buat folder secara rekursif jika belum ada
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        // Nama file bersih: original-timestamp.ext
        cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
    }
});
const upload = multer({ storage: storage });

// Helper untuk membersihkan path URL agar sesuai saat disimpan di DB
// Karena express.static menunjuk ke 'uploads', kita perlu memotong path file sistem
const getRelativeUrl = (req, file) => {
    if (!file) return null;
    // file.path di windows menggunakan backslash, kita ganti ke forward slash untuk URL
    // Kita ambil path relatif dari folder 'uploads'
    const relativePath = path.relative(path.join(__dirname, 'uploads'), file.path).replace(/\\/g, '/');
    return `http://localhost:${PORT}/uploads/${relativePath}`;
};

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- ROUTES ---

// Login System
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: SECRET_TOKEN });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
});

// Middleware Security
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === SECRET_TOKEN) {
        next();
    } else {
        res.status(403).json({ message: 'Security Alert: Unauthorized Access Attempt' });
    }
};

// Get Apps
app.get('/api/apps', (req, res) => {
    const apps = readDB();
    // Sort by date (newest first)
    apps.sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded));
    res.json(apps);
});

// Upload Apps (Multi-Platform & Versioning)
const uploadFields = upload.fields([
    { name: 'appLogo', maxCount: 1 },
    { name: 'screenshot', maxCount: 5 },
    { name: 'file_android', maxCount: 1 },
    { name: 'file_windows', maxCount: 1 },
    { name: 'file_ios', maxCount: 1 },
    { name: 'file_linux', maxCount: 1 },
    { name: 'appFile', maxCount: 1 } // Legacy support to prevent crashes
]);

app.post('/api/upload', verifyToken, (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: `Upload Error: ${err.message} (${err.field || 'unknown field'})` });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ message: 'Internal Server Error during upload.' });
        }
        next();
    });
}, (req, res) => {
    try {
        const { name, version, description, logoShape } = req.body;
        const files = req.files || {};

        if (!name || !version) {
            return res.status(400).json({ message: 'Name and Version are required.' });
        }

        let apps = readDB();
        
        // Cari aplikasi berdasarkan nama (Case insensitive)
        let appIndex = apps.findIndex(a => a.name.toLowerCase() === name.toLowerCase());
        let appData = appIndex !== -1 ? apps[appIndex] : null;

        // Helper URL
        const getUrl = (fileObj) => fileObj ? getRelativeUrl(req, fileObj[0]) : null;

        // Persiapkan Data File Versi Ini
        const versionFiles = {
            android: getUrl(files.file_android),
            windows: getUrl(files.file_windows),
            ios: getUrl(files.file_ios),
            linux: getUrl(files.file_linux)
        };

        // Fallback for legacy appFile
        if (files.appFile && !versionFiles.android) {
            versionFiles.android = getUrl(files.appFile);
        }

        // Validasi
        if (!versionFiles.android && !versionFiles.windows && !versionFiles.ios && !versionFiles.linux) {
             return res.status(400).json({ message: 'At least one platform file (APK, EXE, etc.) is required for this version.' });
        }

        const newVersionEntry = {
            version: version,
            date: new Date().toISOString(),
            files: versionFiles,
            size: Object.values(files).flat().filter(f => f.fieldname.startsWith('file_') || f.fieldname === 'appFile').reduce((acc, f) => acc + f.size, 0)
        };

        if (appData) {
            // --- UPDATE EXISTING APP ---
            if (description) appData.description = description;
            if (logoShape) appData.logoShape = logoShape; // Update Shape
            if (files.appLogo) appData.logoUrl = getUrl(files.appLogo);
            
            if (files.screenshot) {
                const newScreenshots = files.screenshot.map(f => getRelativeUrl(req, f));
                appData.screenshots = newScreenshots; 
            }
            if (appData.screenshots && appData.screenshots.length > 0) appData.screenshotUrl = appData.screenshots[0]; 

            const vIndex = appData.versions.findIndex(v => v.version === version);
            if (vIndex !== -1) {
                appData.versions[vIndex].files = { ...appData.versions[vIndex].files, ...versionFiles };
                appData.versions[vIndex].date = new Date().toISOString();
            } else {
                appData.versions.unshift(newVersionEntry);
            }
            apps[appIndex] = appData;

        } else {
            // --- CREATE NEW APP ---
            if (!files.appLogo || !files.screenshot) {
                return res.status(400).json({ message: 'New App requires Logo and Screenshots.' });
            }

            const screenshotUrls = files.screenshot.map(f => getRelativeUrl(req, f));
            
            appData = {
                id: Date.now().toString(),
                name: name,
                description: description || "No description provided.",
                logoUrl: getUrl(files.appLogo),
                logoShape: logoShape || 'rounded-2xl', // Default shape
                screenshotUrl: screenshotUrls[0],
                screenshots: screenshotUrls,
                versions: [newVersionEntry]
            };
            apps.unshift(appData);
        }

        writeDB(apps);
        res.status(200).json({ message: 'Deployment Successful', app: appData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const SERVER_PORT = process.env.PORT || 5000;
app.listen(SERVER_PORT, () => {
    console.log(`NeuNoval Core System v3.0 running on port ${SERVER_PORT}`);
});