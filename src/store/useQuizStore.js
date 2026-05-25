import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
const generateStudentId = () => 'student_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useQuizStore = create(
  persist(
    (set, get) => ({
      lang: 'ar',
      studentId: null, 
      currentStep: 0,

      toggleLanguage: () => set((state) => ({ lang: state.lang === 'ar' ? 'en' : 'ar' })),

      startSession: async () => {
        try {
          await signInAnonymously(auth);

          let currentStudentId = get().studentId;
          if (!currentStudentId) {
            currentStudentId = generateStudentId();
            set({ studentId: currentStudentId });
          }

          const userRef = doc(db, 'sessions', currentStudentId);
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              studentId: currentStudentId,
              currentStep: 1,
              createdAt: new Date().toISOString()
            });
            set({ currentStep: 1 });
          } else {
            const savedData = docSnap.data();
            set({ currentStep: savedData.currentStep || 1 });
          }
        } catch (error) {
          console.error("Session Error:", error);
          alert("حدث خطأ في بدء الجلسة، تأكد من اتصال الإنترنت.");
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
        currentStep: state.currentStep 
      }), 
    }
  )
);