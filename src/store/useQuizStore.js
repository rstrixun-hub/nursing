import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const generateStudentId = () => 'student_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
export const useQuizStore = create(
  persist(
    (set, get) => ({
      lang: 'en',
      studentId: null,
      currentStep: 0,
      theme: 'dark',

      toggleLanguage: () => set((state) => ({ lang: state.lang === 'ar' ? 'en' : 'ar' })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      startSession: async () => {
        try {
          let currentStudentId = get().studentId;
          if (!currentStudentId) {
            currentStudentId = generateStudentId();
            set({ studentId: currentStudentId });
          }
          set({ currentStep: 1 }); // ← انتقل فوراً قبل أي network

          await signInAnonymously(auth);

          const userRef = doc(db, 'sessions', currentStudentId);
          const versionSnap = await getDoc(doc(db, 'config', 'version'));
          const latestVersion = versionSnap.exists() ? JSON.stringify(versionSnap.data()) : '';
          const docSnap = await getDoc(userRef);

          if (!docSnap.exists()) {
            await setDoc(userRef, {
              studentId: currentStudentId,
              currentStep: 1,
              contentVersion: latestVersion,
              createdAt: new Date().toISOString()
            });
          } else {
            const savedData = docSnap.data();
            const savedVersion = savedData.contentVersion || '';

            if (savedData.currentStep === 4 && savedVersion === '' && latestVersion !== '') {
              await setDoc(userRef, {
                contentVersion: latestVersion,
              }, { merge: true });
              set({ currentStep: 4 });

            } else if (latestVersion !== '' && savedVersion !== latestVersion && savedData.currentStep === 4) {
              await setDoc(userRef, {
                currentStep: 1,
                contentVersion: latestVersion,
                lastUpdate: new Date().toISOString()
              }, { merge: true });
              set({ currentStep: 1 });

            } else {
              set({ currentStep: savedData.currentStep || 1 });
            }
          }
        } catch (error) {
          console.error("Session Error:", error);
        }
      },

      setStep: async (step) => {
        set({ currentStep: step });

        const currentStudentId = get().studentId;
        if (currentStudentId) {
          const userRef = doc(db, 'sessions', currentStudentId);
          await setDoc(userRef, {
            currentStep: step,
            lastUpdate: new Date().toISOString()
          }, { merge: true });
        }
      }
    }),
    {
      name: 'smart-assessment-storage',
      partialize: (state) => ({
        lang: state.lang,
        studentId: state.studentId,
        currentStep: state.currentStep,
        theme: state.theme,
      }),
    }
  )
);