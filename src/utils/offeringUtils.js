
/**
 * Generates a standardized syllabus filename from an offering.
 *
 * Format: SUBJECT-COURSE-SECTION-PROFESSOR-SEMESTER.pdf
 * Example: CPSC-44000-001-ericpogue-fall2026.pdf
 *
 * @param {Object} offering
 * @returns {string}
 */
export function generateSyllabusFilename(offering) {
    const { subjectKey, courseCode, sectionCodeKey, semesterKey } = offering.fields
    const { professorNameFirst, professorNameLast } = offering.display

    const [year, seasonNumber] = semesterKey.split("_")

    const seasons = {
        "1": "spring",
        "2": "summer",
        "3": "fall"
    }

    const season = seasons[seasonNumber]

    if (!season || !year) {
        throw new Error(`Invalid semester key: ${semesterKey}`)
    }

    const professorName = `${professorNameFirst}${professorNameLast}`.toLowerCase()

    return `${subjectKey}-${courseCode}-${sectionCodeKey}-${professorName}-${season}${year}.pdf`
}
