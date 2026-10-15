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

  /**
   * The terminal-style logo in the header. `prefix` + `initial` is always
   * shown; `rest` slides in on hover. "0x" + "T" + "aha" -> 0xTaha.
   */
  handle: { prefix: '0x', initial: 'T', rest: 'aha' },

  /** The home-page hero types these out one after the other, in a loop. */
  typewriter: ['0xTaha', 'Taha Ben Issa'],

  /** One line under the name on the home page. */
  role: 'Network & Systems Security Student',

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

  nav: [
    { href: '/', label: 'Home' },
    { href: '/writeups', label: 'Writeups' },
    { href: '/notes', label: 'Notes' },
    { href: '/papers', label: 'Papers' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
  ],

  /** About page: the "Areas of Focus" grid. `color` is any CSS colour. */
  focus: [
    { icon: 'shield', name: 'Intrusion Detection', color: '#ef4444' },
    { icon: 'network', name: 'Networks & Protocols', color: '#3b82f6' },
    { icon: 'bug', name: 'Web Exploitation', color: '#10b981' },
    { icon: 'cpu', name: 'ML for Security', color: '#a855f7' },
    { icon: 'target', name: 'CTF Competitions', color: '#f97316' },
    { icon: 'terminal', name: 'Systems Programming', color: '#06b6d4' },
  ],

  /** About page: the "Technologies & Tools" chips. */
  technologies: [
    'C', 'Python', 'Assembly', 'Bash', 'JavaScript',
    'Linux', 'Windows', 'Docker', 'Wireshark', 'Burp Suite',
    'Ghidra', 'GDB', 'Nmap', 'Scikit-learn', 'Git',
  ],
} as const;

export type Site = typeof SITE;
