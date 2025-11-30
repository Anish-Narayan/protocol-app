import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCDGtnpBXX7jn6E2Ty_0KNfMOX2cRTa1uE",
  authDomain: "time-manager-11.firebaseapp.com",
  projectId: "time-manager-11",
  storageBucket: "time-manager-11.firebasestorage.app",
  messagingSenderId: "997732909868",
  appId: "1:997732909868:web:6e66647e5ae7996bf16289"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Android requires this specific persistence setting
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});