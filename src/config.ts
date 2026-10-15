// ---------------------------------------------------------------------------
// Single place to edit who you are. Everything on the site reads from here.
// ---------------------------------------------------------------------------

export const SITE = {
  // Change these two when you buy a domain.
  url: 'https://tahabenissa.github.io',
  base: '/', // '/blog' if you deploy to a project page instead of <user>.github.io

  title: 'Taha Ben Issa',
  tagline: 'Malware analysis · reverse engineering · Windows internals',
  description:
    'Documenting what I take apart and learn in malware analysis, reverse engineering ' +
    'and Windows internals — posts, study notes, cheatsheets and CTF writeups.',

  /**
   * The terminal-style logo in the header. `prefix` + `initial` is always
   * shown; `rest` slides in on hover. "0x" + "T" + "aha" -> 0xTaha.
   */
  handle: { prefix: '0x', initial: 'T', rest: 'aha' },

  /** The home-page hero types these out one after the other, in a loop. */
  typewriter: ['0xTaha', 'Taha Ben Issa'],

  /** One line under the name on the home page. */
  role: 'Malware Analysis & Reverse Engineering',

  author: {
    name: 'Taha Ben Issa',
    // Second-year Génie Informatique (ARSI) — edit freely.
    bio:
      'Computer engineering student (ARSI) at IIT, into malware analysis. I take samples apart — ' +
      'static and dynamic analysis, reverse engineering, Windows internals — and write up what ' +
      'I find here as posts, study notes and cheatsheets.',
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

  /**
   * Header links. An entry with `collection` is only shown once that section
   * has something published, so empty sections don't clutter the menu.
   */
  nav: [
    { href: '/', label: 'Home' },
    { href: '/posts', label: 'Posts' },
    { href: '/notes', label: 'Notes' },
    { href: '/cheatsheets', label: 'Cheatsheets', collection: 'cheatsheets' },
    { href: '/writeups', label: 'Writeups', collection: 'writeups' },
    { href: '/projects', label: 'Projects', collection: 'projects' },
    { href: '/papers', label: 'Papers', collection: 'papers' },
    { href: '/competitions', label: 'Competitions', collection: 'competitions' },
    { href: '/about', label: 'About' },
  ],

  /** About page: the "Areas of Focus" grid. `color` is any CSS colour. */
  focus: [
    { icon: 'bug', name: 'Malware Analysis', color: '#ef4444' },
    { icon: 'cpu', name: 'Reverse Engineering', color: '#10b981' },
    { icon: 'terminal', name: 'Windows Internals', color: '#3b82f6' },
    { icon: 'shield', name: 'Detection (YARA / Sigma)', color: '#a855f7' },
    { icon: 'network', name: 'Network Forensics', color: '#06b6d4' },
    { icon: 'target', name: 'CTF Competitions', color: '#f97316' },
  ],

  /** About page: the "Technologies & Tools" chips. */
  technologies: [
    'C', 'x86/x64 Assembly', 'Python', 'PowerShell',
    'Ghidra', 'IDA Free', 'x64dbg', 'PE-bear', 'Detect It Easy',
    'Process Monitor', 'Process Hacker', 'Wireshark', 'YARA', 'Volatility',
    'FLARE VM', 'REMnux', 'Linux', 'Windows',
  ],
} as const;

export type Site = typeof SITE;
