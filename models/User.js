const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    fullName:  { type: String, default: '' },
    bio:       { type: String, default: '' },
    avatar:    { type: String, default: '' },
    coverImage:{ type: String, default: '' },
    theme:     { type: String, default: 'studio', enum: ['studio', 'editorial', 'ocean', 'garden', 'midnight', 'canvas'] },
      accentHex: { type: String, default: '#3978d4' },
    location:  { type: String, default: '' },
    website:   { type: String, default: '' },
    // Social links
    github:    { type: String, default: '' },
    twitter:   { type: String, default: '' }, // X (formerly Twitter)
    linkedin:  { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook:  { type: String, default: '' },
    youtube:   { type: String, default: '' },
    tiktok:    { type: String, default: '' },
    discord:   { type: String, default: '' },
    telegram:  { type: String, default: '' },
    behance:   { type: String, default: '' },
    dribbble:  { type: String, default: '' },
    farcaster: { type: String, default: '' }
  },
  skillCategory: {
    type: String,
    default: 'other',
    enum: ['webdev', 'mobiledev', 'design', 'marketing', 'content', 'video', 'photography', 'music', 'writing', 'data', 'devops', 'web3', 'community', 'research', 'other']
  },
  skills: [String],
  customLinks: [{
    title: { type: String, required: true },
    url:   { type: String, required: true },
    icon:  { type: String, default: 'link' }
  }],
  zeroAuthDAO: {
    address:     { type: String, default: '' },
    score:       { type: Number, default: 0 },
    badges:      { type: Number, default: 0 },
    nftCount:    { type: Number, default: 0 },
    bounties:    { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    bnsName:     { type: String, default: '' },
    displayName: { type: String, default: '' },
    profileCompleteness: { type: Number, default: 0 },
    verified:    { type: Boolean, default: false },
    lastFetched: { type: Date }
  },
  accentColor: {
    type: String,
    default: 'purple',
    enum: ['purple', 'blue', 'green', 'rose', 'orange', 'dark']
  },
  reputation: {
    score:    { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  },
  profileViews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
