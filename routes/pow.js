const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const POW = require('../models/POW');
const User = require('../models/User');
const Badge = require('../models/Badge');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'public', 'uploads');

// Ensure upload directory exists at startup
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `pow-${req.session.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed'));
  }
});

// Wraps multer in a promise so its errors are caught by try/catch
function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.fields([{ name: 'proofFile', maxCount: 1 }, { name: 'featuredImage', maxCount: 1 }])(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const powTypeIcons = {
  code:        'fa-code',
  design:      'fa-palette',
  marketing:   'fa-bullhorn',
  content:     'fa-pen-nib',
  video:       'fa-video',
  photography: 'fa-camera',
  music:       'fa-music',
  research:    'fa-flask',
  dao:         'fa-users',
  community:   'fa-comments',
  project:     'fa-project-diagram',
  writing:     'fa-file-alt',
  other:       'fa-briefcase',
  github:      'fa-brands fa-github',
  article:     'fa-file-alt'
};

// Add POW form
router.get('/add', requireAuth, (req, res) => {
  res.render('pow/add', { title: 'Add Proof of Work', error: null, powTypeIcons });
});

// Create POW
router.post('/add', requireAuth, async (req, res) => {
  try {
    await runUpload(req, res);

    const { title, description, type, proofLink, skills, startDate, endDate, isPublic } = req.body;

    if (!title || !description || !type || !startDate) {
      return res.render('pow/add', {
        title: 'Add Proof of Work',
        error: 'Please fill in all required fields',
        powTypeIcons
      });
    }

    const pow = new POW({
      user:          req.session.user.id,
      title,
      description,
      type,
      proofLink:     proofLink || '',
      fileUrl:       req.files?.proofFile?.[0]     ? `/uploads/${req.files.proofFile[0].filename}`     : '',
      featuredImage: req.files?.featuredImage?.[0] ? `/uploads/${req.files.featuredImage[0].filename}` : '',
      skills:        skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      startDate:     new Date(startDate),
      endDate:       endDate ? new Date(endDate) : null,
      isPublic:      isPublic === 'on'
    });

    await pow.save();

    await User.findByIdAndUpdate(req.session.user.id, { $inc: { 'reputation.score': 10 } });

    const powCount = await POW.countDocuments({ user: req.session.user.id });
    if (powCount === 1)  await new Badge({ user: req.session.user.id, name: 'First POW',     description: 'Added your first proof of work', icon: 'star'   }).save();
    if (powCount === 5)  await new Badge({ user: req.session.user.id, name: '5 POWs',        description: 'Added 5 proofs of work',         icon: 'award'  }).save();
    if (powCount === 10) await new Badge({ user: req.session.user.id, name: 'Power Builder', description: 'Added 10 proofs of work',        icon: 'trophy' }).save();

    res.redirect('/dashboard');
  } catch (error) {
    console.error('POW add error:', error);
    res.render('pow/add', {
      title: 'Add Proof of Work',
      error: error.message || 'Failed to add POW. Please try again.',
      powTypeIcons
    });
  }
});

// Edit POW form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const pow = await POW.findOne({ _id: req.params.id, user: req.session.user.id });
    if (!pow) return res.redirect('/dashboard');
    res.render('pow/edit', { title: 'Edit Proof of Work', pow, error: null, powTypeIcons });
  } catch (error) {
    console.error(error);
    res.redirect('/dashboard');
  }
});

// Update POW
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    await runUpload(req, res);

    const { title, description, type, proofLink, skills, startDate, endDate, isPublic } = req.body;

    const pow = await POW.findOne({ _id: req.params.id, user: req.session.user.id });
    if (!pow) return res.redirect('/dashboard');

    pow.title       = title;
    pow.description = description;
    pow.type        = type;
    pow.proofLink   = proofLink || '';
    if (req.files?.proofFile?.[0])     pow.fileUrl       = `/uploads/${req.files.proofFile[0].filename}`;
    if (req.files?.featuredImage?.[0]) pow.featuredImage = `/uploads/${req.files.featuredImage[0].filename}`;
    pow.skills    = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    pow.startDate = new Date(startDate);
    pow.endDate   = endDate ? new Date(endDate) : null;
    pow.isPublic  = isPublic === 'on';

    await pow.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error('POW edit error:', error);
    try {
      const pow = await POW.findOne({ _id: req.params.id, user: req.session.user.id });
      res.render('pow/edit', { title: 'Edit Proof of Work', pow, error: error.message || 'Failed to update POW', powTypeIcons });
    } catch (_) {
      res.redirect('/dashboard');
    }
  }
});

// Delete POW
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await POW.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
  } catch (error) {
    console.error(error);
  }
  res.redirect('/dashboard');
});

module.exports = router;
