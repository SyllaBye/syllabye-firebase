const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldPath } = require("firebase-admin/firestore")

const db = getFirestore()
const PAGE_SIZE = 20


exports.getOfferings = onCall(async (request) => {
    const authId = request.auth?.uid
    if (!authId) {
        throw new HttpsError("unauthenticated", "Unauthorized: No auth ID found in request")
    }
    // TODO: Add authorization check (if applicable)
    // Recommended Authorization:
    // All professors
    // All admins


    // read the incoming request
    const {
        cursor = null,
        filters: {
            statusKey = null,
            semesterKey = null,
            subjectKey = null,
            professorKey = null
        } = {}
    } = request.data ?? {}


    // filter the offerings
    let query = db.collection("offerings")
    if (statusKey != null) {
        query = query.where("statusKey", "==", statusKey)
    }
    if (semesterKey != null) {
        query = query.where("semesterKey", "==", semesterKey)
    }
    if (subjectKey != null) {
        query = query.where("subjectKey", "==", subjectKey)
    }
    if (professorKey != null) {
        query = query.where("professorKey", "==", professorKey)
    }


    // order and paginate the offerings
    query = query.orderBy("subjectKey")
                .orderBy("courseCode")
                .orderBy("sectionCodeKey")
                .orderBy(FieldPath.documentId())
    if (cursor != null) {
        query = query.startAfter (
            cursor.subjectKey,
            cursor.courseCode,
            cursor.sectionCodeKey,
            cursor.id
        )
    }
    query = query.limit(PAGE_SIZE + 1) // try to retreive an extra doc to test if more pages exist


    // get all of the data we need to craft a response
    let snapshot = await query.get()
    const pageDocs = snapshot.docs.slice(0, PAGE_SIZE);
    const hasMore = snapshot.docs.length > PAGE_SIZE;

    // get the display data associated with each offering (basically a custom join operation)
    const offerings = await Promise.all(pageDocs.map(async (doc) => {
        const data = doc.data()

        const [course, professor, semester, offeringStatus] = await Promise.all([
            db.collection("courses")
                .where("subjectKey", "==", data.subjectKey)
                .where("courseCode", "==", data.courseCode) 
                .get(),
            data.professorKey ? db.collection("users").doc(data.professorKey).get() : null,
            data.semesterKey ? db.collection("semesters").doc(data.semesterKey).get() : null,
            data.statusKey ? db.collection("offering-statuses").doc(data.statusKey).get() : null,
        ])

        if (course.size !== 1) {
            throw new HttpsError("internal", `Data integrity violation: offering ${doc.id} references ${course.size} matching courses.`)
        }

        const courseData = course.docs[0]?.data()
        const professorData = professor?.data()
        const semesterData = semester?.data()
        const statusData = offeringStatus?.data()

        return  {
            id: doc.id,
            fields: data,
            display: {
                courseName: (courseData ? courseData.name : null),
                professorEmail: (professorData ? professorData.email : null),
                professorNameFirst: (professorData ? professorData.nameFirst : null),
                professorNameLast: (professorData ? professorData.nameLast : null),
                semesterName: (semesterData ? semesterData.name : null),
                offeringStatusName: (statusData ? statusData.name : null)
            }
        }
    }))


    // construct a new cursor for the next potential page request
    const lastDoc = pageDocs[pageDocs.length - 1]
    const nextCursor = lastDoc ? {
        subjectKey: lastDoc.get("subjectKey"),
        courseCode: lastDoc.get("courseCode"),
        sectionCodeKey: lastDoc.get("sectionCodeKey"),
        id: lastDoc.id
    } : null


    // return stuff
    return {
        offerings: offerings,
        cursor: nextCursor,
        hasMore: hasMore
    }
})