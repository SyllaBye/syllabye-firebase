const { onCall, HttpsError } = require("firebase-functions/v2/https")
const { getFirestore } = require("firebase-admin/firestore")
const { getAuth } = require("firebase-admin/auth")

const db = getFirestore()

/*
   Resolves the currently authenticated Firebase user to their corresponding
   Syllabye user document. If no association exists, verifies the user's
   email and creates the association using the matching users document.
  
   Returns the associated users document ID and its data.
 */

exports.resolveCurrentUser = onCall(async (request) => {
    const authId = request.auth?.uid
    if (!authId) {
        throw new HttpsError("unauthenticated", "Unauthorized: No auth ID found in request")
    }

    
    let userDoc = null // We will return information from this document

    const userAuthDoc = await db.collection("user-auth").doc(authId).get()
    // This user has logged in before
    if (userAuthDoc.exists) { 
        userDoc = await db.collection("users").doc(userAuthDoc.data().user).get()

        if (!userDoc.exists) { // Invariant Check: this should never run
            throw new HttpsError("internal", "Data integrity violation: user-auth references a nonexistent users document.")
        }
    }
    // This user has never logged in before
    else {
        const authUser = await getAuth().getUser(authId)
        const email = authUser.email?.toLowerCase().trim();

        // verified emails only
        if (!email) {throw new HttpsError("failed-precondition", "Your authentication account does not have an email address.")}
        if (!authUser.emailVerified) {throw new HttpsError("permission-denied", "Your email address must be verified before your account can be associated.")}

        // find the user by email instead
        const snapshot = await db.collection("users").where("email", "==", email).get()

        if (snapshot.empty) {throw new HttpsError("not-found", "No matching user found.")}
        if (snapshot.size > 1) {throw new HttpsError("failed-precondition", "Multiple users found with this email.")}

        userDoc = snapshot.docs[0]

        // associate the authUid with the "users" collection document
        await db.collection("user-auth").doc(authId).create({
            user: userDoc.id
        })
    }
   
    return {
        id: userDoc.id,
        data: userDoc.data()
    }
})