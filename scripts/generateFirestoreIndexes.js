const fs = require("fs");

// Optional equality filters.
// subjectKey is excluded because it is always part of the ordering.
const filterFields = [
    "statusKey",
    "semesterKey",
    "professorKey"
];

// Fields used to sort offerings.
const orderFields = [
    "subjectKey",
    "courseCode",
    "sectionCodeKey"
];

const indexes = [];

// Generate every possible combination of optional filters.
for (let mask = 0; mask < 2 ** filterFields.length; mask++) {
    const selectedFilters = filterFields.filter(
        (_, index) => mask & (1 << index)
    );

    // Add equality-filter fields first, then the remaining sort fields.
    const fields = [
        ...selectedFilters,
        ...orderFields.filter(field => !selectedFilters.includes(field))
    ];

    indexes.push({
        collectionGroup: "offerings",
        queryScope: "COLLECTION",
        fields: fields.map(field => ({
            fieldPath: field,
            order: "ASCENDING"
        }))
    });
}

const config = {
    indexes,
    fieldOverrides: []
};

// Write the generated configuration to the project root.
fs.writeFileSync(
    "firestore.indexes.json",
    JSON.stringify(config, null, 2)
);

console.log(`Generated ${indexes.length} composite indexes.`);