import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { JournalEntry } from '../types';

const COLLECTION_NAME = 'journal_entries';

export const subscribeToJournalEntries = (userId: string, callback: (entries: JournalEntry[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const entries: JournalEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() } as JournalEntry);
    });
    callback(entries);
  }, (error) => {
    console.error("Error subscribing to journal entries:", error);
  });
};

export const addJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), entry);
    return docRef.id;
  } catch (error) {
    console.error("Error adding journal entry:", error);
    throw error;
  }
};

export const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
};

export const deleteJournalEntry = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
};
