// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCk30B0Tok91zfRdl0pl5Exmy5UnBCH8I",
  authDomain: "inventory-management-app-2868e.firebaseapp.com",
  projectId: "inventory-management-app-2868e",
  storageBucket: "inventory-management-app-2868e.appspot.com",
  messagingSenderId: "711768367930",
  appId: "1:711768367930:web:24e7723c275b945ea1a603",
  measurementId: "G-PP5N9DMJV7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export { app, firestore };