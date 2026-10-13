const express = require('express');
const router = express.Router();

router.get('/demo', (req, res) => {
  const profileUser = {
    username: 'powtfolio',
    profile: {
      fullName: 'POWtfolio',
      bio: 'A portfolio platform for Web3 builders, community leads, growth marketers, and emerging contributors. Bring your projects, contributions, and proof together in one link.',
      avatar: '/logo.jpg',
      coverImage: '/demo-cover.svg',
      theme: 'editorial',
      accentHex: '#3978d4',
      location: '',
      website: process.env.BASE_URL || 'http://localhost:3000',
      github: '', twitter: '', linkedin: '', instagram: '', facebook: '', youtube: '',
      tiktok: '', discord: '', telegram: '', behance: '', dribbble: '', farcaster: ''
    },
    skillCategory: 'web3',
    customLinks: [
      { title: 'Create your portfolio', url: '/auth/register', icon: 'arrow-right' },
      { title: 'Discover POWtfolio', url: '/', icon: 'circle-info' }
    ],
    zeroAuthDAO: {}
  };
  const pows = [
    {
      title: 'Your work, in one link',
      description: 'Bring projects, contributions, and case studies together in a portfolio made for the way Web3 teams discover talent.',
      type: 'project', featuredImage: '/demo-fieldnotes.svg', proofLink: '/auth/register', fileUrl: '',
      skills: ['Portfolio', 'Web3 careers', 'Personal brand'], startDate: new Date('2026-01-01'),
      verification: { status: 'self-reported' }
    },
    {
      title: 'Proof that travels with you',
      description: 'Give your work and contributions a clear place to live, then share the page wherever you meet your next opportunity.',
      type: 'community', featuredImage: '/demo-ledger.svg', proofLink: '/auth/register', fileUrl: '',
      skills: ['Proof of work', 'Community', 'Contributions'], startDate: new Date('2026-01-01'),
      verification: { status: 'self-reported' }
    },
    {
      title: 'A portfolio that feels like you',
      description: 'Choose a visual direction, add your links and images, and shape a page that reflects your place in the ecosystem.',
      type: 'design', featuredImage: '/demo-system.svg', proofLink: '/auth/register', fileUrl: '',
      skills: ['Custom themes', 'Profile design', 'Personalization'], startDate: new Date('2026-01-01'),
      verification: { status: 'self-reported' }
    }
  ];

  res.render('profile/portfolio', {
    title: 'POWtfolio | Web3 Work Portfolio', profileUser, pows, badges: [],
    stats: { totalPOWs: pows.length, verifiedPOWs: 0, totalBadges: 0, reputation: 0 },
    isOwner: false,
    skillCategoryLabels: { web3: 'Web3 Work Portfolio' },
    powTypeLabels: {
      project: { label: 'Portfolio platform', icon: 'fa-layer-group' },
      community: { label: 'Community careers', icon: 'fa-users' },
      design: { label: 'Profile design', icon: 'fa-pen-ruler' }
    }
  });
});

module.exports = router;
