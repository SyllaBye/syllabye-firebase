const { HttpsError } = require("firebase-functions/v2/https")
const { getFirestore } = require("firebase-admin/firestore")

const db = getFirestore()

/**
 * Retrieves the users document associated with a Firebase Auth UID.
 */
async function getUserDocument(authId) {
    const userAuthDoc = await db.collection("user-auth").doc(authId).get()

    if (!userAuthDoc.exists) {
        throw new HttpsError(
            "failed-precondition",
            "User account has not been associated with a Syllabye account."
        )
    }

    const userId = userAuthDoc.data().user
    const userDoc = await db.collection("users").doc(userId).get()

    if (!userDoc.exists) { // Invariant Check: this should never run
        throw new HttpsError("internal", "Data integrity violation: user-auth references a nonexistent users document.")
    }

    return userDoc
}

/**
 * Ensures the caller is an active professor.
 */
async function requireProfessor(request) {
    const authId = request.auth?.uid
    if (!authId) {throw new HttpsError("unauthenticated", "Authentication required.")}

    const userDoc = await getUserDocument(authId)
    if (userDoc.data().activeProfessor !== true) {throw new HttpsError("permission-denied", "Professor access required.")}

    return userDoc
}

/**
 * Ensures the caller is an active admin.
 */
async function requireAdmin(request) {
    const authId = request.auth?.uid
    if (!authId) {throw new HttpsError("unauthenticated", "Authentication required.")}

    const userDoc = await getUserDocument(authId);
    if (userDoc.data().activeAdmin !== true) {throw new HttpsError("permission-denied", "Admin access required.");}

    return userDoc
}


module.exports = {
    getUserDocument,
    requireProfessor,
    requireAdmin
}