const mongoose = require('mongoose');

const powSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['code', 'design', 'marketing', 'content', 'video', 'photography', 'music', 'research', 'dao', 'community', 'project', 'writing', 'other',
           // backward compat
           'github', 'article']
  },
  proofLink:     { type: String, default: '' },
  fileUrl:       { type: String, default: '' },
  featuredImage: { type: String, default: '' },
  skills:    [String],
  startDate: { type: Date, required: true },
  endDate:   { type: Date },
  verification: {
    status: {
      type: String,
      default: 'self-reported',
      enum: ['self-reported', 'platform-verified', 'project-verified']
    }
  },
  isPublic: { type: Boolean, default: true },
  views:    { type: Number, default: 0 },
  createdAt:{ type: Date, default: Date.now }
});

powSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('POW', powSchema);
