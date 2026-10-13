function formatDisplayName(username = '') {
  return String(username)
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase()) || 'Creator';
}

function applyPortfolioDefaults(user) {
  if (!user) return user;

  const oldStarterBio = 'I’m building in public. This portfolio is where I share projects, experiments, and the proof behind the work.';
  const upgradingStarter = user.starterProfile && user.profile?.bio === oldStarterBio;
  if (user.starterProfile && !upgradingStarter) return user;

  if (!user.profile) user.profile = {};
  if (!user.profile.fullName) user.profile.fullName = formatDisplayName(user.username);
  if (!user.profile.bio || upgradingStarter) {
    user.profile.bio = 'Building my path in Web3 through community, growth, and thoughtful conversations. Interested in community management, growth marketing, and contributor opportunities. Open to internships and collaborations.';
  }
  if (!user.profile.avatar) user.profile.avatar = '/demo-avatar.svg';
  if (!user.profile.coverImage) user.profile.coverImage = '/demo-cover.svg';
  if (!user.profile.theme) user.profile.theme = 'studio';
  if (!user.profile.accentHex) user.profile.accentHex = '#3978d4';
  if ((!user.skillCategory || user.skillCategory === 'other') && (!user.starterProfile || upgradingStarter)) {
    user.skillCategory = 'community';
  }

  return user;
}

module.exports = { applyPortfolioDefaults, formatDisplayName };
