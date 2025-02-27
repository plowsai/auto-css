const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const archiver = require('archiver');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create output directory for generated projects
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Endpoint to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return file information
    res.json({
        file: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            path: `/uploads/${req.file.filename}`
        }
    });
});

// Endpoint to handle folder upload
app.post('/upload-folder', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Create a project ID for this upload
    const projectId = Date.now().toString();
    const projectDir = path.join(uploadsDir, projectId);
    
    // Create project directory
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
    }
    
    // Move files to project directory
    const fileInfos = req.files.map(file => {
        const newPath = path.join(projectDir, file.originalname);
        fs.renameSync(file.path, newPath);
        
        return {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            path: `/uploads/${projectId}/${file.originalname}`
        };
    });
    
    // Return project information
    res.json({
        projectId,
        files: fileInfos
    });
});

// Code generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Or use gpt-3.5-turbo for lower cost
      messages: [
        {
          role: "system",
          content: "You are a helpful programming assistant. Respond with clean, well-formatted code based on the user's request. Include only the code without explanations unless specifically asked."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic code output
      max_tokens: 2048
    });
    
    // Extract the response text
    const responseText = completion.choices[0].message.content.trim();
    
    // Simple code extraction and language detection
    let code = responseText;
    let language = 'javascript'; // Default
    
    // Check if response is wrapped in markdown code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\s*\n([\s\S]+?)\n```/;
    const match = responseText.match(codeBlockRegex);
    
    if (match) {
      language = match[1] || 'javascript';
      code = match[2].trim();
    }
    
    // Generate a unique ID for this generation
    const generationId = Date.now().toString();
    const outputPath = path.join(outputDir, generationId);
    
    // Create output directory
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    
    // Save the generated code to a file
    const filename = `generated.${language === 'css' ? 'css' : language === 'html' ? 'html' : 'js'}`;
    fs.writeFileSync(path.join(outputPath, filename), code);
    
    // If projectId is provided, copy uploaded files to output directory
    if (projectId) {
        const projectPath = path.join(uploadsDir, projectId);
        if (fs.existsSync(projectPath)) {
            // Copy project files to output directory
            const files = fs.readdirSync(projectPath);
            files.forEach(file => {
                const srcPath = path.join(projectPath, file);
                const destPath = path.join(outputPath, file);
                fs.copyFileSync(srcPath, destPath);
            });
        }
    }
    
    res.json({ 
        code, 
        language,
        generationId,
        downloadUrl: `/download/${generationId}`
    });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Endpoint to download generated project
app.get('/download/:generationId', (req, res) => {
    const { generationId } = req.params;
    const outputPath = path.join(outputDir, generationId);
    
    // Check if the generation exists
    if (!fs.existsSync(outputPath)) {
        return res.status(404).json({ error: 'Generated project not found' });
    }
    
    // Create a zip file
    const zipFilename = `autocss-project-${generationId}.zip`;
    const zipPath = path.join(outputDir, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });
    
    // Listen for all archive data to be written
    output.on('close', function() {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        // Send the zip file
        res.download(zipPath, zipFilename, (err) => {
            if (err) {
                console.error('Error sending zip file:', err);
            }
            // Delete the zip file after sending
            fs.unlinkSync(zipPath);
        });
    });
    
    // Handle archive warnings
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            console.warn('Archive warning:', err);
        } else {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create archive' });
        }
    });
    
    // Handle archive errors
    archive.on('error', function(err) {
        console.error('Archive error:', err);
        res.status(500).json({ error: 'Failed to create archive' });
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add files from the output directory
    archive.directory(outputPath, false);
    
    // Finalize the archive
    archive.finalize();
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});