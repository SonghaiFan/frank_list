import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import profileData from './data/profile.json';
import versionsData from './data/versions.json';
import './styles.css';

type PersonalInfo = {
  first_name: string;
  first_name_pronounce?: string;
  last_name: string;
  last_name_pronounce?: string;
  nickname?: string;
  location: string;
  phone: string;
  email: string;
  links: {
    github: string;
    website: string;
    linkedin: string;
  };
  summary: string;
};

type EducationItem = {
  degree: string;
  institution: string;
  period: string;
  research?: string;
  gpa?: string;
  highlights?: string[];
};

type WorkItem = {
  title: string;
  company: string;
  location?: string;
  period: string;
  type?: string;
  responsibilities: string[];
  achievements?: string[];
};

type ResearchItem = {
  point: string;
  detail?: string;
};

type ResearchSection = {
  title: string;
  items: ResearchItem[];
};

type SkillPoolItem = {
  name: string;
  category?: string;
  level: number;
  tech_stack?: string[];
  core_skill?: string[];
  methodology?: string[];
  use_scenario?: string[];
};

type ProjectCase = {
  title: string;
  details: string[];
};

type ProjectItem = {
  id: string;
  title: string;
  description: string;
  features?: string[];
  tech_stack: string;
  year?: string;
  items?: ProjectCase[];
};

type PublicationItem = {
  title: string;
  authors: string;
  venue: string;
  year: string;
  type?: string;
};

type CoverLetter = {
  recipient?: {
    company?: string;
    position?: string;
    department?: string;
  };
  opening: string;
  body: string[];
  closing: string;
  signature: string;
};

type VersionData = {
  display_name: string;
  theme_color?: string;
  icon?: string;
  summary?: string;
  cover_letter?: CoverLetter;
  content_config?: {
    include_cover_letter?: boolean;
    selected_skills?: string[];
    sections_order?: string[];
    projects_limit?: number;
    include_projects?: string[];
  };
  content_overrides?: {
    project_descriptions?: Record<string, string>;
  };
};

type ProfileData = {
  personal_info: PersonalInfo;
  education: EducationItem[];
  work_experience: WorkItem[];
  phd_research: {
    sections: ResearchSection[];
  };
  skills_pool: Record<string, SkillPoolItem>;
  projects: ProjectItem[];
  publications: PublicationItem[];
  certifications?: string[];
};

type VersionsFile = {
  config?: {
    default_version?: string;
  };
  versions: Record<string, VersionData>;
};

type Block = {
  html: string;
  estimatedHeight: number;
};

type SectionChunk = {
  title: string;
  icon: string;
  continuation: boolean;
  blocks: Block[];
};

const profile = profileData as ProfileData;
const versions = versionsData as VersionsFile;

const MM_TO_PX = 96 / 25.4;
const PAGE_WIDTH = 210 * MM_TO_PX;
const PAGE_HEIGHT = 297 * MM_TO_PX;
const PAGE_PADDING = 8 * MM_TO_PX;
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2;
const PAGE_CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;

const FONT = {
  xl: '700 36px Inter',
  mdTitle: '600 13px Inter',
  smTitle: '600 10px Inter',
  body: '400 9px Inter',
  small: '400 8px Inter',
  xsmall: '400 7px Inter',
  tiny: '400 6px Inter'
};

const LINE = {
  xl: 36,
  mdTitle: 16,
  smTitle: 12,
  body: 11,
  small: 10,
  xsmall: 9,
  tiny: 7
};

const SPACE = {
  0: 0,
  1: 1,
  2: 4,
  3: 6,
  4: 8,
  6: 12,
  8: 16
};

let currentVersionKey =
  versions.config?.default_version && versions.versions[versions.config.default_version]
    ? versions.config.default_version
    : Object.keys(versions.versions)[0];

let includeCoverLetter =
  versions.versions[currentVersionKey]?.content_config?.include_cover_letter ?? false;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function linesFor(text: string, font: string, width: number, lineHeight: number): string[] {
  const prepared = prepareWithSegments(text, font);
  return layoutWithLines(prepared, width, lineHeight).lines.map((line) => line.text);
}

function renderLineSpans(lines: string[], className: string): string {
  return lines.map((line) => `<span class="${className}">${escapeHtml(line)}</span>`).join('');
}

function renderTextBlock(text: string, font: string, width: number, lineHeight: number, className: string) {
  const lines = linesFor(text, font, width, lineHeight);
  return {
    lines,
    html: renderLineSpans(lines, className),
    height: lines.length * lineHeight
  };
}

function versionConfig(): VersionData {
  return versions.versions[currentVersionKey];
}

function activeSummary(): string {
  return versionConfig().summary ?? profile.personal_info.summary;
}

function activeThemeColor(): string {
  return versionConfig().theme_color ?? '#3A69E7';
}

function activeSectionsOrder(): string[] {
  return (
    versionConfig().content_config?.sections_order ?? [
      'summary',
      'phd_research',
      'publications',
      'technical_skills',
      'projects',
      'education',
      'work_experience',
      'certifications'
    ]
  );
}

function selectedProjectItems(): ProjectItem[] {
  const includeIds = versionConfig().content_config?.include_projects;
  const projects = includeIds
    ? includeIds
        .map((id) => profile.projects.find((project) => project.id === id))
        .filter((project): project is ProjectItem => Boolean(project))
    : [...profile.projects];
  const limit = versionConfig().content_config?.projects_limit ?? projects.length;
  return projects.slice(0, limit);
}

function selectedSkills() {
  const selectedIds = versionConfig().content_config?.selected_skills ?? [];
  const chosen: Array<SkillPoolItem & { id: string }> = [];
  const others: Array<SkillPoolItem & { id: string }> = [];

  Object.entries(profile.skills_pool).forEach(([id, skill]) => {
    const item = { ...skill, id };
    if (selectedIds.includes(id)) {
      chosen.push(item);
    } else {
      others.push(item);
    }
  });

  chosen.sort((a, b) => b.level - a.level);
  others.sort((a, b) => b.level - a.level);
  return { chosen, others };
}

function replaceCoverLetterPlaceholders(text: string, recipient: CoverLetter['recipient']) {
  if (!recipient) {
    return text;
  }

  return text
    .replaceAll('[Company Name]', recipient.company ?? '[Company Name]')
    .replaceAll('[Position Title]', recipient.position ?? '[Position Title]')
    .replaceAll('[Department/Team]', recipient.department ?? '[Department/Team]')
    .replaceAll('[AI/Engineering Team]', recipient.department ?? '[AI/Engineering Team]')
    .replaceAll('[UX/Research Team]', recipient.department ?? '[UX/Research Team]')
    .replaceAll('[Development/Design Team]', recipient.department ?? '[Development/Design Team]')
    .replaceAll('[Engineering/Data Team]', recipient.department ?? '[Engineering/Data Team]');
}

function buildShell() {
  return `
    <a class="github-fork-ribbon right-bottom" href="https://github.com/SonghaiFan/persona"
      data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</a>

    <header class="app-header">
      <div class="app-header-content">
        <div class="app-branding">
          <div class="brand-logo-container">
            <h1 class="brand-logo-text">Frankie</h1>
            <p class="brand-text">Resume</p>
          </div>
        </div>

        <div class="app-controls">
          <div class="md-form-field">
            <div class="md-select-wrapper">
              <select id="versionSelect" class="md-select">
                ${Object.entries(versions.versions)
                  .map(
                    ([key, value]) =>
                      `<option value="${escapeHtml(key)}"${key === currentVersionKey ? ' selected' : ''}>${escapeHtml(
                        value.display_name
                      )}</option>`
                  )
                  .join('')}
              </select>
              <span class="md-arrow">&#9662;</span>
            </div>
          </div>

          <div class="md-form-field">
            <label class="cover-letter-toggle">
              <input type="checkbox" id="coverLetterToggle" class="toggle-checkbox"${
                includeCoverLetter ? ' checked' : ''
              }>
              <span class="toggle-label">Include Cover Letter</span>
            </label>
          </div>
        </div>
      </div>
    </header>

    <div class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>Loading resume...</span>
    </div>

    <div id="resume"></div>
    <div id="measure-root" aria-hidden="true"></div>
  `;
}

function setTheme() {
  document.body.className = document.body.className
    .split(' ')
    .filter((cls) => !cls.startsWith('theme-') && cls !== 'loading' && cls !== 'loaded')
    .join(' ')
    .trim();
  document.body.classList.add(`theme-${currentVersionKey}`);
  document.body.style.setProperty('--theme-color', activeThemeColor());
}

function headerBlock(): Block {
  const personal = profile.personal_info;
  const rightWidth = PAGE_CONTENT_WIDTH * 0.48;
  const namePieces = [
    {
      className: 'name-part',
      text: personal.first_name,
      pronunciation: personal.first_name_pronounce
    },
    {
      className: 'name-part nickname',
      text: `(${personal.nickname ?? 'Frank'})`
    },
    {
      className: 'name-part',
      text: personal.last_name,
      pronunciation: personal.last_name_pronounce
    }
  ];

  const location = renderTextBlock(personal.location, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');
  const phone = renderTextBlock(personal.phone, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');
  const email = renderTextBlock(personal.email, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');

  const githubText = personal.links.github.replace('https://github.com/', 'github.com/');
  const websiteText = personal.links.website.replace('https://', '');
  const linkedinText = personal.links.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/');

  const github = renderTextBlock(githubText, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');
  const website = renderTextBlock(websiteText, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');
  const linkedin = renderTextBlock(linkedinText, FONT.small, rightWidth / 3 - 14, LINE.small, 'measure-line');

  const estimatedHeight = Math.max(LINE.xl + LINE.body + SPACE[1], 2 * LINE.small + SPACE[2]) + SPACE[6];

  return {
    estimatedHeight,
    html: `
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <div class="name-container">
              ${namePieces
                .map(
                  (piece) => `
                    <span class="name-group">
                      <span class="${piece.className}">${escapeHtml(piece.text)}</span>
                      ${
                        piece.pronunciation
                          ? `<span class="pronunciation">${escapeHtml(piece.pronunciation)}</span>`
                          : ''
                      }
                    </span>
                  `
                )
                .join('')}
            </div>
          </div>

          <div class="contact-info">
            <div class="contact-info-row">
              <span class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${location.html}</span></span>
              <span class="contact-item"><i class="fas fa-phone"></i><span>${phone.html}</span></span>
              <span class="contact-item"><i class="fas fa-envelope"></i><span>${email.html}</span></span>
            </div>
            <div class="contact-info-row">
              <span class="contact-item"><i class="fab fa-github"></i><a href="${escapeHtml(
                personal.links.github
              )}" target="_blank" class="contact-link">${github.html}</a></span>
              <span class="contact-item"><i class="fas fa-globe"></i><a href="${escapeHtml(
                personal.links.website
              )}" target="_blank" class="contact-link">${website.html}</a></span>
              <span class="contact-item"><i class="fab fa-linkedin"></i><a href="${escapeHtml(
                personal.links.linkedin
              )}" target="_blank" class="contact-link">${linkedin.html}</a></span>
            </div>
          </div>
        </div>
      </header>
    `
  };
}

function wrapSectionChunk(chunk: SectionChunk): Block {
  const label = chunk.continuation ? `${chunk.title} (cont.)` : chunk.title;
  return {
    estimatedHeight:
      SPACE[3] +
      LINE.mdTitle +
      SPACE[2] +
      chunk.blocks.reduce((sum, block) => sum + block.estimatedHeight, 0) +
      Math.max(0, chunk.blocks.length - 1) * SPACE[2],
    html: `
      <section>
        <h2><i class="${chunk.icon}"></i> ${escapeHtml(label)}</h2>
        ${chunk.blocks.map((block) => block.html).join('')}
      </section>
    `
  };
}

function packIntoChunks(title: string, icon: string, blocks: Block[]): SectionChunk[] {
  const chunks: SectionChunk[] = [];
  const maxHeight = PAGE_CONTENT_HEIGHT - 80;
  let current: Block[] = [];
  let currentHeight = 0;

  blocks.forEach((block) => {
    const nextHeight = currentHeight + block.estimatedHeight + (current.length > 0 ? SPACE[2] : 0);
    if (current.length > 0 && nextHeight > maxHeight) {
      chunks.push({
        title,
        icon,
        continuation: chunks.length > 0,
        blocks: current
      });
      current = [block];
      currentHeight = block.estimatedHeight;
      return;
    }

    current.push(block);
    currentHeight = nextHeight;
  });

  if (current.length > 0) {
    chunks.push({
      title,
      icon,
      continuation: chunks.length > 0,
      blocks: current
    });
  }

  return chunks;
}

function summarySection(): SectionChunk[] {
  const summary = renderTextBlock(activeSummary(), FONT.body, PAGE_CONTENT_WIDTH, LINE.body, 'measure-line');
  return packIntoChunks('Summary', 'fas fa-user-circle', [{ estimatedHeight: summary.height, html: `<p>${summary.html}</p>` }]);
}

function researchSection(): SectionChunk[] {
  const sections = profile.phd_research.sections;
  const blocks: Block[] = [];

  sections.forEach((section) => {
    const heading = renderTextBlock(section.title, FONT.smTitle, PAGE_CONTENT_WIDTH, LINE.smTitle, 'measure-line');
    blocks.push({
      estimatedHeight: heading.height + SPACE[1],
      html: `<h3>${heading.html}</h3>`
    });

    const listItems = section.items
      .map((item) => {
        const point = renderTextBlock(item.point, FONT.small, PAGE_CONTENT_WIDTH - SPACE[3], LINE.small, 'measure-line');
        const detail = item.detail
          ? renderTextBlock(item.detail, FONT.tiny, PAGE_CONTENT_WIDTH - SPACE[3], LINE.tiny, 'measure-line')
          : null;
        return {
          estimatedHeight: point.height + (detail ? detail.height + SPACE[1] : 0) + SPACE[1],
          html: `
            <li>
              ${point.html}
              ${detail ? `<p class="research-item-detail">${detail.html}</p>` : ''}
            </li>
          `
        };
      })
      .reduce(
        (acc, item) => {
          acc.height += item.estimatedHeight;
          acc.html += item.html;
          return acc;
        },
        { height: 0, html: '' }
      );

    blocks.push({
      estimatedHeight: listItems.height,
      html: `<ul>${listItems.html}</ul>`
    });
  });

  return packIntoChunks('Research', 'fas fa-microscope', blocks);
}

function publicationsSection(): SectionChunk[] {
  const publications = [...profile.publications].sort((a, b) => Number(b.year) - Number(a.year));
  const blocks = publications.map((publication) => {
    const leftWidth = PAGE_CONTENT_WIDTH * 0.72;
    const rightWidth = PAGE_CONTENT_WIDTH * 0.22;
    const title = renderTextBlock(publication.title, FONT.body, leftWidth, LINE.body, 'measure-line');
    const authors = renderTextBlock(publication.authors, FONT.small, leftWidth, LINE.small, 'measure-line');
    const venue = renderTextBlock(
      `${publication.venue}${publication.type ? ` (${publication.type})` : ''}`,
      FONT.tiny,
      rightWidth,
      LINE.tiny,
      'measure-line'
    );
    const year = renderTextBlock(publication.year, FONT.tiny, rightWidth, LINE.tiny, 'measure-line');
    return {
      estimatedHeight: Math.max(title.height + authors.height, venue.height + year.height) + SPACE[2],
      html: `
        <div class="publication-item">
          <div class="publication-left">
            <div class="publication-title">${title.html}</div>
            <div class="publication-authors">${authors.html}</div>
          </div>
          <div class="publication-right">
            <div class="publication-venue">${venue.html}</div>
            <div class="publication-time">${year.html}</div>
          </div>
        </div>
      `
    };
  });
  return packIntoChunks('Publications', 'fas fa-book', blocks);
}

function skillDetailsBlock(skill: SkillPoolItem, showAll: boolean): { html: string; height: number } {
  const categories = Object.entries(skill)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => ({ key, label: key.toUpperCase().replaceAll('_', ' '), items: value as string[] }));
  const visible = showAll ? categories : categories.slice(0, 1);

  let totalHeight = 0;
  const html = visible
    .map((category) => {
      const contentWidth = PAGE_CONTENT_WIDTH * 0.36;
      const content = renderTextBlock(category.items.join(', '), FONT.xsmall, contentWidth, LINE.xsmall, 'measure-line');
      totalHeight += Math.max(content.height, LINE.tiny) + SPACE[1];
      return `
        <div class="skill-subcategory">
          <span class="skill-content skill-items-container">${content.html}</span>
          <span class="skill-label">${escapeHtml(category.label)}</span>
        </div>
      `;
    })
    .join('');
  return { html, height: totalHeight };
}

function skillsSection(): SectionChunk[] {
  const { chosen, others } = selectedSkills();

  const selectedBlocks = chosen.map((skill) => {
    const details = skillDetailsBlock(skill, true);
    return {
      estimatedHeight: LINE.smTitle + details.height + SPACE[3],
      html: `
        <div class="skill-item skill-selected">
          <div class="skill-header">
            <div class="skill-name-group">
              <div class="skill-name">${escapeHtml(skill.name)}</div>
            </div>
            <div class="skill-level"><span class="skill-rating">${'●'.repeat(skill.level)}${'○'.repeat(
              5 - skill.level
            )}</span></div>
          </div>
          <div class="skill-details">
            ${details.html}
          </div>
        </div>
      `
    };
  });

  const unselectedHtml = others
    .map((skill) => {
      const details = skillDetailsBlock(skill, false);
      return `
        <div class="unselected-skill-item">
          <div class="unselected-skill-header">
            <div class="skill-name-group">
              <div class="unselected-skill-name">${escapeHtml(skill.name)}</div>
            </div>
            <div class="skill-level"><span class="skill-rating">${'●'.repeat(skill.level)}${'○'.repeat(
              5 - skill.level
            )}</span></div>
          </div>
          <div class="unselected-skill-details">${details.html}</div>
        </div>
      `;
    })
    .join('');

  const otherHeight =
    others.length * (LINE.smTitle + LINE.xsmall + SPACE[2]) + Math.max(0, others.length - 1) * SPACE[2] + SPACE[2];

  const gridBlock: Block = {
    estimatedHeight:
      Math.ceil(selectedBlocks.length / 2) * 120 + (others.length > 0 ? Math.max(120, otherHeight) : 0),
    html: `
      <div class="skills-grid">
        ${selectedBlocks.map((block) => block.html).join('')}
        ${
          others.length > 0
            ? `
              <div class="skill-item skill-unselected-container">
                <div class="unselected-skills-list">
                  ${unselectedHtml}
                </div>
              </div>
            `
            : ''
        }
      </div>
    `
  };

  return packIntoChunks('Skills', 'fas fa-cubes', [gridBlock]);
}

function projectsSection(): SectionChunk[] {
  const overrides = versionConfig().content_overrides?.project_descriptions ?? {};
  const projects = selectedProjectItems();
  const blocks = projects.map((project) => {
    const leftWidth = PAGE_CONTENT_WIDTH * 0.72;
    const rightWidth = PAGE_CONTENT_WIDTH * 0.22;
    const title = renderTextBlock(project.title, FONT.smTitle, leftWidth, LINE.smTitle, 'measure-line');
    const description = renderTextBlock(
      overrides[project.id] ?? project.description,
      FONT.small,
      leftWidth,
      LINE.small,
      'measure-line'
    );
    const featuresHtml = (project.features ?? [])
      .map((feature) => {
        const item = renderTextBlock(feature, FONT.small, leftWidth - SPACE[3], LINE.small, 'measure-line');
        return { html: `<li>${item.html}</li>`, height: item.height + SPACE[1] };
      })
      .reduce(
        (acc, item) => {
          acc.html += item.html;
          acc.height += item.height;
          return acc;
        },
        { html: '', height: 0 }
      );
    const techStack = renderTextBlock(project.tech_stack, FONT.tiny, rightWidth, LINE.tiny, 'measure-line');
    const cases = project.items ?? [];
    const casesHtml = cases
      .map((item) => {
        const caseTitle = renderTextBlock(item.title, FONT.small, PAGE_CONTENT_WIDTH - SPACE[2] * 2, LINE.small, 'measure-line');
        const caseDetails = item.details
          .map((detail) => {
            const detailText = renderTextBlock(detail, FONT.small, PAGE_CONTENT_WIDTH - SPACE[3] * 2, LINE.small, 'measure-line');
            return { html: `<li>${detailText.html}</li>`, height: detailText.height + SPACE[1] };
          })
          .reduce(
            (acc, detail) => {
              acc.html += detail.html;
              acc.height += detail.height;
              return acc;
            },
            { html: '', height: 0 }
          );
        return {
          html: `
            <div class="case-item">
              <h4>${caseTitle.html}</h4>
              <ul>${caseDetails.html}</ul>
            </div>
          `,
          height: caseTitle.height + caseDetails.height + SPACE[4]
        };
      })
      .reduce(
        (acc, item) => {
          acc.html += item.html;
          acc.height += item.height;
          return acc;
        },
        { html: '', height: 0 }
      );

    return {
      estimatedHeight:
        title.height +
        description.height +
        featuresHtml.height +
        Math.max(techStack.height, 0) +
        casesHtml.height +
        SPACE[4],
      html: `
        <div class="project-item">
          <div class="project-main-content">
            <div class="project-left">
              <div class="project-title">${title.html}</div>
              <div class="project-description">${description.html}</div>
              ${featuresHtml.html ? `<ul class="project-features">${featuresHtml.html}</ul>` : ''}
            </div>
            <div class="project-right">
              <div class="tech-stack">${techStack.html}</div>
            </div>
          </div>
          ${
            casesHtml.html
              ? `
                <div class="project-case">
                  ${casesHtml.html}
                </div>
              `
              : ''
          }
        </div>
      `
    };
  });
  return packIntoChunks('Projects', 'fas fa-star', blocks);
}

function educationSection(): SectionChunk[] {
  const blocks = profile.education.map((education) => {
    const leftWidth = PAGE_CONTENT_WIDTH * 0.72;
    const rightWidth = PAGE_CONTENT_WIDTH * 0.22;
    const degree = renderTextBlock(education.degree, FONT.smTitle, leftWidth, LINE.smTitle, 'measure-line');
    const research = education.research
      ? renderTextBlock(education.research, FONT.small, leftWidth, LINE.small, 'measure-line')
      : null;
    const gpa = education.gpa ? renderTextBlock(education.gpa, FONT.small, leftWidth, LINE.small, 'measure-line') : null;
    const highlights = (education.highlights ?? [])
      .map((highlight) => {
        const item = renderTextBlock(highlight, FONT.small, leftWidth - SPACE[3], LINE.small, 'measure-line');
        return { html: `<li>${item.html}</li>`, height: item.height + SPACE[1] };
      })
      .reduce(
        (acc, item) => {
          acc.html += item.html;
          acc.height += item.height;
          return acc;
        },
        { html: '', height: 0 }
      );
    const institution = renderTextBlock(education.institution, FONT.tiny, rightWidth, LINE.tiny, 'measure-line');
    const period = renderTextBlock(education.period, FONT.tiny, rightWidth, LINE.tiny, 'measure-line');
    return {
      estimatedHeight:
        degree.height +
        (research?.height ?? 0) +
        (gpa?.height ?? 0) +
        highlights.height +
        Math.max(institution.height + period.height, 0) +
        SPACE[2],
      html: `
        <div class="education-item">
          <div class="education-left">
            <div class="education-title">${degree.html}</div>
            ${research ? `<div>${research.html}</div>` : ''}
            ${gpa ? `<div>${gpa.html}</div>` : ''}
            ${highlights.html ? `<ul>${highlights.html}</ul>` : ''}
          </div>
          <div class="education-right">
            <div class="institution">${institution.html}</div>
            <div class="education-period">${period.html}</div>
          </div>
        </div>
      `
    };
  });
  return packIntoChunks('Education', 'fas fa-graduation-cap', blocks);
}

function workSection(): SectionChunk[] {
  const blocks = profile.work_experience.map((job) => {
    const leftWidth = PAGE_CONTENT_WIDTH * 0.72;
    const rightWidth = PAGE_CONTENT_WIDTH * 0.22;
    const title = renderTextBlock(job.title, FONT.smTitle, leftWidth, LINE.smTitle, 'measure-line');
    const responsibilities = job.responsibilities
      .map((responsibility) => {
        const item = renderTextBlock(responsibility, FONT.small, leftWidth - SPACE[3], LINE.small, 'measure-line');
        return { html: `<li>${item.html}</li>`, height: item.height + SPACE[1] };
      })
      .reduce(
        (acc, item) => {
          acc.html += item.html;
          acc.height += item.height;
          return acc;
        },
        { html: '', height: 0 }
      );
    const achievements = (job.achievements ?? [])
      .map((achievement) => {
        const item = renderTextBlock(achievement, FONT.small, leftWidth - SPACE[3], LINE.small, 'measure-line');
        return { html: `<li>${item.html}</li>`, height: item.height + SPACE[1] };
      })
      .reduce(
        (acc, item) => {
          acc.html += item.html;
          acc.height += item.height;
          return acc;
        },
        { html: '', height: 0 }
      );
    const company = renderTextBlock(
      [job.company, job.location].filter(Boolean).join(', '),
      FONT.tiny,
      rightWidth,
      LINE.tiny,
      'measure-line'
    );
    const period = renderTextBlock(
      `${job.period}${job.type ? ` • ${job.type}` : ''}`,
      FONT.tiny,
      rightWidth,
      LINE.tiny,
      'measure-line'
    );
    return {
      estimatedHeight:
        title.height +
        responsibilities.height +
        (achievements.html ? LINE.small + achievements.height + SPACE[2] : 0) +
        Math.max(company.height + period.height, 0) +
        SPACE[2],
      html: `
        <div class="work-experience-item">
          <div class="work-left">
            <div class="job-title">${title.html}</div>
            <ul class="job-responsibilities">${responsibilities.html}</ul>
            ${
              achievements.html
                ? `
                  <div class="job-achievements">
                    <div class="achievements-title">Key Achievements:</div>
                    <ul class="achievements-list">${achievements.html}</ul>
                  </div>
                `
                : ''
            }
          </div>
          <div class="work-right">
            <div class="company-location">${company.html}</div>
            <div class="period-type">${period.html}</div>
          </div>
        </div>
      `
    };
  });
  return packIntoChunks('Work', 'fas fa-briefcase', blocks);
}

function certificationsSection(): SectionChunk[] {
  const certifications = profile.certifications ?? [];
  const blocks = certifications.map((certification) => {
    const text = renderTextBlock(certification, FONT.small, PAGE_CONTENT_WIDTH - SPACE[3], LINE.small, 'measure-line');
    return {
      estimatedHeight: text.height + SPACE[1],
      html: `<ul><li>${text.html}</li></ul>`
    };
  });
  return packIntoChunks('Certifications', 'fas fa-certificate', blocks);
}

function sectionChunksByName(name: string): SectionChunk[] {
  switch (name) {
    case 'summary':
      return summarySection();
    case 'phd_research':
      return researchSection();
    case 'publications':
      return publicationsSection();
    case 'technical_skills':
      return skillsSection();
    case 'projects':
      return projectsSection();
    case 'education':
      return educationSection();
    case 'work_experience':
      return workSection();
    case 'certifications':
      return certificationsSection();
    default:
      return [];
  }
}

function coverLetterPage(): string | null {
  if (!includeCoverLetter || !versionConfig().cover_letter) {
    return null;
  }

  const coverLetter = versionConfig().cover_letter!;
  const recipient = coverLetter.recipient ?? {
    company: '[Company Name]',
    position: '[Position Title]',
    department: '[Department/Team]'
  };
  const personal = profile.personal_info;
  const dateString = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const paragraphs = coverLetter.body
    .map((paragraph) => {
      const processed = replaceCoverLetterPlaceholders(paragraph, recipient);
      const rendered = renderTextBlock(processed, FONT.body, PAGE_CONTENT_WIDTH, LINE.body, 'measure-line');
      return `<p>${rendered.html}</p>`;
    })
    .join('');

  return `
    <section class="page cover-letter-page">
      <header class="cover-letter-header">
        <div class="cover-letter-contact">
          <div class="cover-letter-name">${escapeHtml(personal.first_name)} ${escapeHtml(personal.last_name)}</div>
          <div class="cover-letter-contact-details">
            <span>${escapeHtml(personal.email)}</span> •
            <span>${escapeHtml(personal.phone)}</span> •
            <span>${escapeHtml(personal.location)}</span>
          </div>
          <div class="cover-letter-links">
            <span>${escapeHtml(personal.links.github.replace('https://', ''))}</span> •
            <span>${escapeHtml(
              personal.links.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')
            )}</span>
          </div>
        </div>
      </header>

      <div class="cover-letter-date">${escapeHtml(dateString)}</div>
      <div class="cover-letter-recipient">
        <div>${escapeHtml(recipient.company ?? '[Company Name]')}</div>
        <div>${escapeHtml(recipient.department ?? '[Department/Team]')}</div>
        <div>Re: ${escapeHtml(recipient.position ?? '[Position Title]')}</div>
      </div>
      <div class="cover-letter-opening">${escapeHtml(
        replaceCoverLetterPlaceholders(coverLetter.opening, recipient)
      )}</div>
      <div class="cover-letter-body">${paragraphs}</div>
      <div class="cover-letter-closing">
        <div class="closing-text">${escapeHtml(coverLetter.closing)} :)</div>
        <div class="signature">${escapeHtml(coverLetter.signature)}</div>
      </div>
    </section>
  `;
}

function makeMeasurePage(): HTMLElement {
  let root = document.querySelector<HTMLElement>('#measure-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'measure-root';
    document.body.appendChild(root);
  }
  root.innerHTML = `<section class="page"><div class="measure-page-content"></div></section>`;
  return root.querySelector<HTMLElement>('.measure-page-content')!;
}

function paginateResumeBlocks(blocks: Block[]): string[] {
  const pages: string[] = [];
  const measureContent = makeMeasurePage();
  const maxHeight = measureContent.clientHeight;
  let currentBlocks: string[] = [];

  function currentHeight() {
    return measureContent.scrollHeight;
  }

  blocks.forEach((block) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'measure-wrapper';
    wrapper.innerHTML = block.html;
    measureContent.appendChild(wrapper);

    if (currentHeight() > maxHeight && currentBlocks.length > 0) {
      measureContent.removeChild(wrapper);
      pages.push(currentBlocks.join(''));
      currentBlocks = [block.html];
      measureContent.innerHTML = '';
      const fresh = document.createElement('div');
      fresh.className = 'measure-wrapper';
      fresh.innerHTML = block.html;
      measureContent.appendChild(fresh);
      return;
    }

    currentBlocks.push(block.html);
  });

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join(''));
  }

  return pages;
}

function resumePages(): string[] {
  const orderedChunks = activeSectionsOrder().flatMap((name) => sectionChunksByName(name));
  const orderedBlocks = [headerBlock(), ...orderedChunks.map(wrapSectionChunk)];
  return paginateResumeBlocks(orderedBlocks).map(
    (content) => `
      <section class="page">
        ${content}
      </section>
    `
  );
}

function renderPages() {
  const resume = document.querySelector<HTMLElement>('#resume');
  if (!resume) {
    return;
  }

  const pages = [...(coverLetterPage() ? [coverLetterPage()!] : []), ...resumePages()];
  resume.innerHTML = pages.join('');
}

function attachEvents() {
  const versionSelect = document.querySelector<HTMLSelectElement>('#versionSelect');
  if (versionSelect) {
    versionSelect.addEventListener('change', (event) => {
      const nextValue = (event.target as HTMLSelectElement).value;
      if (!versions.versions[nextValue]) {
        return;
      }
      currentVersionKey = nextValue;
      includeCoverLetter = versions.versions[currentVersionKey].content_config?.include_cover_letter ?? false;
      renderApp();
    });
  }

  const coverLetterToggle = document.querySelector<HTMLInputElement>('#coverLetterToggle');
  if (coverLetterToggle) {
    coverLetterToggle.addEventListener('change', (event) => {
      includeCoverLetter = (event.target as HTMLInputElement).checked;
      renderApp();
    });
  }
}

function renderApp() {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    return;
  }

  app.innerHTML = buildShell();
  setTheme();
  renderPages();
  attachEvents();

  requestAnimationFrame(() => {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  });
}

window.addEventListener('resize', () => {
  renderApp();
});

document.body.classList.add('loading');
renderApp();
