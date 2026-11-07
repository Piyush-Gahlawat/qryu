// js/tools/resume-templates/model.js
// Parse free-form resume text into sections, with comprehensive heading detection.

// ===== Heading synonym map =====
// Canonical heading → array of synonyms. Matching is case-insensitive and
// insensitive to extra whitespace, decorations, and "&"/"and" differences.
const HEADINGS = {
    'Summary': [
        'summary', 'professional summary', 'executive summary', 'career summary',
        'personal summary', 'summary of qualifications', 'qualifications summary',
        'summary statement', 'career overview', 'professional overview',
        'personal overview', 'overview', 'profile', 'professional profile',
        'career profile', 'personal profile', 'about', 'about me', 'bio',
        'biography', 'personal statement', 'introduction', 'intro', 'objective',
        'career objective', 'professional objective', 'job objective',
        'objective statement', 'career goal', 'career goals', 'mission',
        'purpose', 'elevator pitch', 'professional background', 'background',
        'about myself', 'personal profile summary'
    ],
    'Experience': [
        'experience', 'work experience', 'professional experience',
        'relevant experience', 'relevant work experience', 'industry experience',
        'previous experience', 'prior experience', 'previous work experience',
        'prior work experience', 'employment', 'employment history',
        'work history', 'job history', 'career history', 'professional history',
        'work record', 'employment record', 'professional record', 'career',
        'positions', 'positions held', 'roles', 'roles held', 'engagements',
        'practicum', 'internship', 'internships', 'internship experience',
        'work background', 'job experience', 'work', 'professional work',
        'career path', 'employment background', 'work tenure',
        'professional experience summary', 'career experience',
        'relevant career experience'
    ],
    'Education': [
        'education', 'academic', 'academic background', 'academic history',
        'academics', 'educational background', 'educational history',
        'education and training', 'training', 'training and education',
        'qualifications', 'academic qualifications', 'educational qualifications',
        'degrees', 'academic credentials', 'educational attainment', 'studies',
        'academic study', 'academic studies', 'educational credentials',
        'academic achievements', 'degrees earned', 'educational experience',
        'academic qualifications and education', 'formal education',
        'academic record'
    ],
    'Skills': [
        'skills', 'technical skills', 'core competencies', 'competencies',
        'core skills', 'key skills', 'professional skills', 'soft skills',
        'hard skills', 'abilities', 'strengths', 'expertise',
        'areas of expertise', 'knowledge', 'areas of knowledge',
        'proficiencies', 'proficiency', 'capabilities', 'skill set',
        'skill summary', 'skills summary', 'technical proficiencies',
        'technical expertise', 'technical abilities', 'technology stack',
        'tech stack', 'stack', 'tools', 'tools and technologies',
        'technologies', 'programming languages', 'programming',
        'frameworks', 'libraries', 'platforms', 'software', 'software skills',
        'computer skills', 'it skills', 'relevant skills', 'specializations',
        'specialties', 'areas of focus', 'core competencies and skills',
        'competency', 'skills and abilities', 'skills and expertise',
        'technical skill set', 'technologies and tools', 'tech skills',
        'competencies and skills', 'skill areas', 'areas of skill',
        'areas of proficiency', 'technical competencies', 'technical knowledge',
        'it competencies', 'computer proficiency', 'computer proficiencies',
        'software proficiency', 'software proficiencies', 'skills highlights',
        'key competencies', 'core areas', 'technical strengths'
    ],
    'Projects': [
        'projects', 'personal projects', 'side projects', 'key projects',
        'notable projects', 'selected projects', 'academic projects',
        'professional projects', 'portfolio', 'portfolio projects',
        'selected works', 'works', 'case studies', 'open source',
        'open source contributions', 'personal project', 'academic project',
        'project experience', 'major projects', 'highlighted projects',
        'projects and works', 'projects worked on', 'work samples',
        'selected project work', 'notable project work', 'side project work',
        'portfolio pieces', 'project highlights', 'key project work'
    ],
    'Certifications': [
        'certifications', 'certification', 'licenses', 'licenses and certifications',
        'certifications and licenses', 'certificates', 'professional certifications',
        'industry certifications', 'accreditations', 'endorsements',
        'credentials', 'professional credentials', 'certification list',
        'license', 'certificates and certifications', 'certifications and certificates',
        'certifications and credentials', 'professional licenses',
        'certifications earned', 'certification credentials',
        'certifications and training', 'training and certifications',
        'professional designations', 'designations', 'industry credentials'
    ],
    'Awards': [
        'awards', 'awards and honors', 'awards and honours', 'honors', 'honours',
        'achievements', 'accomplishments', 'recognition', 'recognitions',
        'distinctions', 'prizes', 'fellowships', 'scholarships', 'grants',
        'awards and recognition', 'awards and achievements',
        'awards and distinctions', 'honors and awards', 'honours and awards',
        'key achievements', 'notable achievements', 'career achievements',
        'awards and certifications', 'achievements and awards',
        'accomplishments and awards', 'professional achievements',
        'key accomplishments', 'notable accomplishments', 'honors achievements',
        'recognition and awards', 'distinctions and awards',
        'selected achievements', 'professional awards', 'industry awards',
        'notable recognitions', 'key recognitions'
    ],
    'Publications': [
        'publications', 'papers', 'published papers', 'research papers',
        'articles', 'published articles', 'books', 'book chapters',
        'journal articles', 'conference papers', 'presentations', 'talks',
        'speaking engagements', 'conference presentations',
        'publications and presentations', 'selected publications',
        'publications list', 'patents', 'patent applications', 'patents pending',
        'patents granted', 'publications and patents', 'papers and publications',
        'published works', 'scholarly publications', 'peer-reviewed publications',
        'published research', 'book contributions'
    ],
    'Research': [
        'research', 'research experience', 'research interests',
        'research work', 'research projects', 'areas of research',
        'research background', 'research focus', 'current research',
        'past research', 'research activities', 'research areas',
        'research summary', 'research highlights', 'selected research',
        'research contributions'
    ],
    'Languages': [
        'languages', 'language skills', 'languages spoken', 'spoken languages',
        'foreign languages', 'linguistic skills', 'language proficiency',
        'language proficiencies', 'spoken language skills',
        'language fluency', 'languages known', 'languages proficiency',
        'known languages', 'additional languages', 'second languages'
    ],
    'Volunteer': [
        'volunteer', 'volunteering', 'volunteer experience', 'volunteer work',
        'community service', 'community involvement', 'civic engagement',
        'social impact', 'community work', 'service work', 'public service',
        'community activities', 'volunteer activities', 'volunteer positions',
        'volunteer background', 'volunteer and community service',
        'community service and volunteering', 'civic involvement',
        'volunteer contributions', 'pro bono work', 'volunteer service',
        'community engagement', 'social contributions'
    ],
    'Activities': [
        'activities', 'extracurricular', 'extracurricular activities',
        'extracurriculars', 'clubs', 'memberships', 'affiliations',
        'professional memberships', 'associations', 'memberships and affiliations',
        'organizations', 'professional organizations',
        'memberships and organizations', 'involvement', 'professional affiliations',
        'professional associations', 'board memberships', 'board service',
        'boards', 'extra curricular activities', 'co curricular activities',
        'professional involvement', 'organization memberships',
        'professional societies', 'societies'
    ],
    'Interests': [
        'interests', 'hobbies', 'hobbies and interests', 'personal interests',
        'leisure activities', 'pastimes', 'interests and hobbies',
        'personal hobbies', 'personal interests and hobbies',
        'leisure interests', 'outside interests', 'personal pastimes',
        'hobbies interests', 'recreational activities', 'personal activities'
    ],
    'References': [
        'references', 'referees', 'reference list', 'available upon request',
        'references available upon request', 'references available',
        'professional references', 'reference details',
        'reference contacts', 'referees available'
    ],
    'Professional Development': [
        'professional development', 'continuing education',
        'continuing professional development', 'cpd', 'professional growth',
        'professional training', 'development', 'learning', 'ongoing learning',
        'training and development', 'further education',
        'certifications and professional development', 'career development',
        'professional learning', 'learning and development',
        'professional education', 'skills development',
        'continuous learning', 'professional enhancement',
        'training and certification', 'training and credentials',
        'professional improvement', 'ongoing development',
        'professional qualifications'
    ],
    'Teaching': [
        'teaching', 'teaching experience', 'teaching background', 'courses',
        'courses taught', 'teaching experience and courses',
        'courses and teaching', 'teaching and research', 'guest lectures',
        'instruction', 'instructional experience', 'academic teaching',
        'teaching and mentoring', 'mentoring experience', 'mentoring'
    ],
    'Conferences': [
        'conferences', 'conference attendance', 'conferences and workshops',
        'workshops', 'seminars', 'symposiums', 'attended conferences',
        'conference participation', 'talks and presentations',
        'conferences attended', 'invited talks', 'invited lectures',
        'speaking engagements attended', 'professional events',
        'workshops attended', 'seminars attended', 'professional conferences'
    ],
    'Additional Information': [
        'additional', 'additional information', 'additional experience',
        'additional skills', 'additional background', 'other',
        'others', 'other information', 'other experience', 'other skills',
        'miscellaneous', 'extra information', 'supplemental information',
        'supplementary information', 'additional details', 'other details',
        'additional qualifications', 'additional notes', 'other notes',
        'misc', 'additional data', 'extras', 'other background',
        'additional credentials', 'further information'
    ]
};

// ===== Normalization =====
// Reduce a heading string to a comparable form: lowercase, no punctuation,
// no decorations, no articles. Both synonyms and user input go through this.
function normalizeHeadingText(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[&+]/g, ' and ')
        .replace(/[-–—\/]/g, ' ')
        .replace(/[^a-z\s]/g, '')
        .replace(/\b(and|the|a|an)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Build reverse lookup: normalized synonym → canonical heading
const SYNONYM_LOOKUP = new Map();
for (const [canonical, synonyms] of Object.entries(HEADINGS)) {
    for (const syn of synonyms) {
        const key = normalizeHeadingText(syn);
        if (key && !SYNONYM_LOOKUP.has(key)) {
            SYNONYM_LOOKUP.set(key, canonical);
        }
    }
}

// ===== Heading detection =====

function stripDecorations(line) {
    return String(line || '')
        // Leading "Section 1:", "Part 2 —"
        .replace(/^\s*(?:section|part)\s+\d+\s*[:\-–—.]\s*/i, '')
        // Leading numbered heading: "1. ", "1) "
        .replace(/^\s*\d{1,2}\s*[\.\)]\s+/, '')
        // Leading decorations: ===, ---, **, ##, ~, etc.
        .replace(/^\s*[=*\-–—_~#]+\s*/, '')
        // Trailing decorations
        .replace(/\s*[=*\-–—_~#]+\s*$/, '')
        // Trailing colon / period / comma / semicolon
        .replace(/[\s:;,.]+$/, '')
        .trim();
}

function isSectionHeading(line) {
    const raw = String(line || '').trim();
    if (!raw) return false;
    if (raw.length > 80) return false;
    if (!/[a-zA-Z]/.test(raw)) return false;

    // Reject bullet-prefixed lines
    if (/^[-•*·◦▪▸►●○■□◆◇✓✔➤➢]\s/.test(raw)) return false;

    const stripped = stripDecorations(raw);
    if (!stripped) return false;
    if (stripped.length > 60) return false;
    if (!/[a-zA-Z]/.test(stripped)) return false;

    const key = normalizeHeadingText(stripped);
    return SYNONYM_LOOKUP.has(key);
}

function canonicalHeading(line) {
    const stripped = stripDecorations(line);
    const key = normalizeHeadingText(stripped);
    return SYNONYM_LOOKUP.get(key) || stripped;
}

// Handle inline headings like "SKILLS: Python, SQL" or "SUMMARY — Senior engineer"
function splitInlineHeading(line) {
    const raw = String(line || '').trim();
    if (!raw) return null;
    if (raw.length > 200) return null;
    const m = raw.match(/^([A-Za-z][A-Za-z\s&]{0,28})\s*[:\-–—]\s+(.+)$/);
    if (!m) return null;
    const headingText = m[1].trim();
    const contentText = m[2].trim();
    if (!contentText) return null;
    if (!isSectionHeading(headingText)) return null;
    return { heading: canonicalHeading(headingText), content: contentText };
}

// ===== Public API =====

/**
 * Parse resume text into { name, contact, sections }.
 * Heuristic: first non-empty line = name; next lines until first section heading = contact.
 */
export function parseResume(text) {
    const lines = String(text || '').split(/\r?\n/);
    const trimmed = lines.map(l => l.trim());
    const nonEmpty = trimmed.filter(l => l.length > 0);

    if (nonEmpty.length === 0) {
        return { name: '', contact: '', sections: [] };
    }

    const name = nonEmpty[0];
    const contactLines = [];
    const sections = [];
    let currentSection = null;

    // Find first section heading (including inline form)
    let firstHeadingIndex = -1;
    for (let i = 1; i < trimmed.length; i++) {
        if (isSectionHeading(trimmed[i]) || splitInlineHeading(trimmed[i])) {
            firstHeadingIndex = i;
            break;
        }
    }

    if (firstHeadingIndex === -1) {
        contactLines.push(...nonEmpty.slice(1));
    } else {
        contactLines.push(...trimmed.slice(1, firstHeadingIndex).filter(l => l.length > 0));

        for (let i = firstHeadingIndex; i < trimmed.length; i++) {
            const line = trimmed[i];
            if (!line) continue;

            const inline = splitInlineHeading(line);
            if (inline) {
                if (currentSection) {
                    currentSection.content = currentSection.content.trim();
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: inline.heading,
                    content: inline.content + '\n'
                };
                continue;
            }

            if (isSectionHeading(line)) {
                if (currentSection) {
                    currentSection.content = currentSection.content.trim();
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: canonicalHeading(line),
                    content: ''
                };
            } else if (currentSection) {
                currentSection.content += line + '\n';
            }
        }
        if (currentSection) {
            currentSection.content = currentSection.content.trim();
            sections.push(currentSection);
        }
    }

    return {
        name,
        contact: contactLines.join(' · '),
        sections
    };
}