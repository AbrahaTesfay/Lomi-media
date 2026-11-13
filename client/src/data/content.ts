export const services = [
  { number: '01', icon: 'film', title: 'Film & Video Production', short: 'Films that earn attention and stay with people.', detail: 'Brand films, documentaries, social-first video, interviews, event coverage and post-production.', tags: ['Commercial films', 'Documentaries', 'Motion'] },
  { number: '02', icon: 'sparkles', title: 'Brand Strategy & Identity', short: 'Make your story unmistakably yours.', detail: 'Brand positioning, visual identity systems, messaging, content direction and campaign concepts.', tags: ['Strategy', 'Identity', 'Art direction'] },
  { number: '03', icon: 'megaphone', title: 'PR & Communications', short: 'Clear messages. Strong relationships.', detail: 'Corporate communication, media relations, reputation support, stakeholder messaging and press materials.', tags: ['Media relations', 'Corporate PR', 'Reputation'] },
  { number: '04', icon: 'monitor', title: 'Digital & Web Experiences', short: 'Digital spaces that feel as good as they work.', detail: 'Professional websites, user experience, content-led design, accessible interfaces and digital launches.', tags: ['Websites', 'UX & UI', 'Digital products'] },
  { number: '05', icon: 'globe', title: 'Social & Digital Campaigns', short: 'The right message in the right moment.', detail: 'Editorial calendars, multi-platform storytelling, campaign design, social creative and reporting.', tags: ['Social strategy', 'Campaigns', 'Content'] },
  { number: '06', icon: 'radio', title: 'Events & Live Media', short: 'Experiences people want to talk about.', detail: 'Event creative direction, live coverage, digital broadcast concepts and branded experiences.', tags: ['Live events', 'Broadcast', 'Experiences'] },
] as const;

export const projects = [
  { index: '01', title: 'Stories without borders', subtitle: 'Documentary storytelling', type: 'FILM / STORYTELLING', className: 'project-terracotta', note: 'Concept showcase' },
  { index: '02', title: 'A brand with a brighter voice', subtitle: 'Identity and communication', type: 'BRANDING / STRATEGY', className: 'project-mint', note: 'Concept showcase' },
  { index: '03', title: 'Ideas built for tomorrow', subtitle: 'Digital experiences', type: 'DIGITAL / CAMPAIGN', className: 'project-lavender', note: 'Concept showcase' },
] as const;

export const processes = [
  { number: '01', title: 'Discover', copy: 'We listen, research and understand your ambitions and audience.' },
  { number: '02', title: 'Define', copy: 'We shape a clear strategy, message and measurable direction.' },
  { number: '03', title: 'Create', copy: 'Our creative team brings the vision to life across formats.' },
  { number: '04', title: 'Elevate', copy: 'We refine, launch and learn to keep your brand moving.' },
] as const;
