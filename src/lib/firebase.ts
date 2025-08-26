
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "meu-aplicativo-wo9gv",
  "appId": "1:107755044608:web:3f862bdefa328c9eeabde5",
  "storageBucket": "meu-aplicativo-wo9gv.firebasestorage.app",
  "apiKey": "AIzaSyBGMqglYVzlssaf9f62rlLH4WCulFnIV78",
  "authDomain": "meu-aplicativo-wo9gv.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "107755044608"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
