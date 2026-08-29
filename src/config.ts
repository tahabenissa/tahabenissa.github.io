// ---------------------------------------------------------------------------
// Single place to edit who you are. Everything on the site reads from here.
// ---------------------------------------------------------------------------

export const SITE = {
  // Change these two when you buy a domain.
  url: 'https://tahabenissa.github.io',
  base: '/', // '/blog' if you deploy to a project page instead of <user>.github.io

  title: 'Taha Ben Issa',
  tagline: 'Network & systems security · detection engineering · ML for security',
  description:
    'Papers I read and what I took from them, CTF writeups and competition results, ' +
    'and the projects I build. A working notebook, kept in public.',

  author: {
    name: 'Taha Ben Issa',
    // Second-year Génie Informatique (ARSI) — edit freely.
    bio:
      'Second-year computer engineering student (ARSI — networks & systems security) at IIT. ' +
      'I read security papers, play CTFs, and build things that detect attacks. ' +
      'This site is where I keep the notes.',
    email: 'tahabenissa30@gmail.com',
    location: 'Morocco',

    // Your photo, served from public/. Drop the file in public/ and point
    // here. Square crops look best — it is displayed as a circle.
    // Set to '' to show an initials monogram instead.
    avatar: '/me.jpg',
  },

  links: {
    github: 'https://github.com/tahabenissa',
    linkedin: 'https://www.linkedin.com/in/tahabenissa',
    // Delete any line you don't want shown in the header/footer.
  },

  // Shown on the home page as your headline numbers. Set to null to hide a stat.
  nav: [
    { href: '/papers', label: 'Papers' },
    { href: '/writeups', label: 'Writeups' },
    { href: '/notes', label: 'Notes' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
  ],
} as const;

export type Site = typeof SITE;
