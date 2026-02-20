import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const deleteUser = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const adminDoc = await admin.firestore()
    .collection('admins')
    .doc(context.auth.uid)
    .get();

  if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  const { userId } = data;

  try {
    // Delete from Authentication
    await admin.auth().deleteUser(userId);
    
    // Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    
    return { success: true, message: 'User fully deleted' };
  } catch (error: any) {
    console.error('Delete user error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to delete user');
  }
});