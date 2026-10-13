const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', { title: 'POWtfolio - Prove Your Work' });
});

// A complete example portfolio that works even when the database is offline.
router.get('/demo', (req, res) => {
  const profileUser = {
    username: 'demo',
    isDemo: true,
    profile: {
      fullName: 'Alex Morgan',
      bio: 'Product designer making digital tools feel a little more human. I care about clear thinking, thoughtful details, and work that helps someone.',
      avatar: '/demo-avatar.svg',
      coverImage: '/demo-cover.svg',
      theme: 'editorial',
      accentHex: '#c46f58',
      location: 'Lagos, Nigeria',
      website: 'https://example.com',
      github: '', twitter: '', linkedin: '', instagram: '', facebook: '', youtube: '',
      tiktok: '', discord: '', telegram: '', behance: 'alexmorgan', dribbble: '', farcaster: ''
    },
    skillCategory: 'design',
    accentColor: 'rose',
    profileViews: 1284,
    reputation: { score: 860 },
    zeroAuthDAO: {},
    customLinks: [
      { title: 'Read my case studies', url: 'https://example.com/work', icon: 'book-open' },
      { title: 'Let’s work together', url: 'https://example.com/contact', icon: 'paper-plane' }
    ]
  };
  const pows = [
    {
      title: 'Fieldnotes | a calmer way to plan',
      description: 'A lightweight planning tool shaped around how small creative teams actually work. I led research, product strategy, and the end-to-end interface.',
      type: 'design', featuredImage: '/demo-fieldnotes.svg', proofLink: 'https://example.com/fieldnotes', fileUrl: '',
      skills: ['Product design', 'Research', 'Figma'], startDate: new Date('2026-02-01'), endDate: new Date('2026-05-01'),
      verification: { status: 'platform-verified' }
    },
    {
      title: 'A better first week with money',
      description: 'A guided onboarding experience that helps new customers understand their money without making the product feel like a spreadsheet.',
      type: 'project', featuredImage: '/demo-ledger.svg', proofLink: 'https://example.com/ledger', fileUrl: '',
      skills: ['UX strategy', 'Prototyping', 'Fintech'], startDate: new Date('2025-08-01'), endDate: new Date('2025-12-01'),
      verification: { status: 'platform-verified' }
    },
    {
      title: 'Open source design system',
      description: 'A practical component library and documentation system for a growing product team.',
      type: 'code', featuredImage: '/demo-system.svg', proofLink: 'https://example.com/system', fileUrl: '',
      skills: ['Design systems', 'Accessibility', 'Open source'], startDate: new Date('2025-03-01'), endDate: new Date('2025-06-01'),
      verification: { status: 'self-reported' }
    }
  ];
  res.render('profile/view', {
    title: 'Alex Morgan | POWtfolio Demo', profileUser, pows, badges: [],
    stats: { totalPOWs: 12, verifiedPOWs: 8, totalBadges: 4, reputation: 860 },
    isOwner: false,
    skillCategoryLabels: { design: 'Product Designer' },
    powTypeLabels: {
      design: { label: 'Product design', icon: 'fa-pen-ruler' },
      project: { label: 'Fintech · Product strategy', icon: 'fa-layer-group' },
      code: { label: 'Open source', icon: 'fa-code' }
    }
  });
});

module.exports = router;
