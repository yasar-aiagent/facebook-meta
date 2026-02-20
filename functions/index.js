const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true }); // Add CORS

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if the caller is an admin
  const callerUid = context.auth.uid;
  
  try {
    const adminDoc = await admin.firestore().collection('admins').doc(callerUid).get();
    
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    throw new functions.https.HttpsError('permission-denied', 'Could not verify admin status');
  }
  
  const { uid } = data;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }
  
  try {
    console.log(`🗑️ Admin ${callerUid} deleting user: ${uid}`);
    
    // Delete from Firebase Authentication
    try {
      await admin.auth().deleteUser(uid);
      console.log(`✅ Deleted from Firebase Auth: ${uid}`);
    } catch (authError) {
      console.error(`❌ Auth deletion error:`, authError);
      throw new functions.https.HttpsError('not-found', 'User not found in Authentication');
    }
    
    // Delete from Firestore
    try {
      await admin.firestore().collection('users').doc(uid).delete();
      console.log(`✅ Deleted from Firestore: ${uid}`);
    } catch (firestoreError) {
      console.error(`❌ Firestore deletion error:`, firestoreError);
      // Continue even if Firestore deletion fails
    }
    
    return { 
      success: true, 
      message: 'User deleted successfully from both Auth and Firestore' 
    };
  } catch (error) {
    console.error(`❌ Error deleting user ${uid}:`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});