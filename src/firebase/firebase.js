// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuLDYCzeLz3egmRAJlcn_Eiv-wF0vdLL0",
  authDomain: "antabayqc.firebaseapp.com",
  projectId: "antabayqc",
  storageBucket: "antabayqc.firebasestorage.app",
  messagingSenderId: "1087251765011",
  appId: "1:1087251765011:web:84cab33460ae5db128ece6",
  measurementId: "G-BZ43Z94802"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);