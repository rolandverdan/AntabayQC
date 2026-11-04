import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDuLDYCzeLz3egmRAJlcn_Eiv-wF0vdLL0',
  authDomain: 'antabayqc.firebaseapp.com',
  projectId: 'antabayqc',
  storageBucket: 'antabayqc.firebasestorage.app',
  messagingSenderId: '1087251765011',
  appId: '1:1087251765011:web:84cab33460ae5db128ece6',
  measurementId: 'G-BZ43Z94802',
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)