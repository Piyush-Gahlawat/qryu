// js/tools/resume-templates/model.js — parse free-form resume text into sections.

const SECTION_KEYWORDS = [
    { key: 'summary', patterns: [/^summary/i, /^profile/i, /^objective/i] },
    { key: 'experience', patterns: [/^experience/i, /^work\s+experience/i, /^professional\s+experience/i, /^employment/i] },
    { key: 'education', patterns: [/^education/i, /^academic/i] },
    { key: 'skills', patterns: [/^skills/i, /^technical\s+skills/i, /^core\s+competencies/i] },
    { key: 'projects', patterns: [/^projects?/i] },
    { key: 'certifications', patterns: [/^certifications?/i, /^licenses?/i] }
];

/**
 * Parse resume text into { name, contact, sections }.
 * Heuristic: first non-empty line = name; next lines until first section heading = contact.
 */
export function parseResume(text) {
    const lines = text.split(/\r?\n/);
    const trimmed = lines.map(l => l.trim());
    const nonEmpty = trimmed.filter(l => l.length > 0);

    if (nonEmpty.length === 0) {
        return { name: '', contact: '', sections: [] };
    }

    let name = nonEmpty[0];
    let contactLines = [];
    let sections = [];
    let currentSection = null;

    // Find first section heading index
    let firstHeadingIndex = -1;
    for (let i = 1; i < trimmed.length; i++) {
        if (isSectionHeading(trimmed[i])) {
            firstHeadingIndex = i;
            break;
        }
    }

    if (firstHeadingIndex === -1) {
        // No sections found — treat everything after name as contact
        contactLines = nonEmpty.slice(1);
    } else {
        contactLines = trimmed.slice(1, firstHeadingIndex).filter(l => l.length > 0);

        // Parse sections
        for (let i = firstHeadingIndex; i < trimmed.length; i++) {
            const line = trimmed[i];
            if (isSectionHeading(line)) {
                if (currentSection) {
                    currentSection.content = currentSection.content.trim();
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: normalizeHeading(line),
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
        name: name,
        contact: contactLines.join(' · '),
        sections: sections
    };
}

function isSectionHeading(line) {
    if (!line || line.length > 60) return false;
    return SECTION_KEYWORDS.some(k => k.patterns.some(p => p.test(line)));
}

function normalizeHeading(line) {
    // Use the first matching keyword's canonical label
    for (const k of SECTION_KEYWORDS) {
        if (k.patterns.some(p => p.test(line))) {
            return k.key.charAt(0).toUpperCase() + k.key.slice(1);
        }
    }
    return line;
}