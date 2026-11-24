const fs = require("fs");

// Optional equality filters.
// semesterKey is excluded because it is always part of the ordering.
const filterFields = [
    "statusKey",
    "subjectKey",
    "professorKey"
];

// Fields used to sort offerings.
const orderFields = [
    "semesterKey",
    "subjectKey",
    "courseCode",
    "sectionCodeKey"
];

const indexes = [];

for (let mask = 0; mask < 2 ** filterFields.length; mask++) {
    const selectedFilters = filterFields.filter(
        (_, index) => mask & (1 << index)
    );

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

fs.writeFileSync(
    "firestore.indexes.json",
    JSON.stringify(config, null, 2)
);

console.log(`Generated ${indexes.length} composite indexes.`);