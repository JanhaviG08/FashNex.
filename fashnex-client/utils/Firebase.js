import {getAuth, GoogleAuthProvider} from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "loginfashnex.firebaseapp.com",
  projectId: "loginfashnex",
  storageBucket: "loginfashnex.firebasestorage.app",
  messagingSenderId: "152433326169",
  appId: "1:152433326169:web:0880bfd1f46855fdf49948"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export {auth, provider}