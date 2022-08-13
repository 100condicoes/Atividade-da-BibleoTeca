import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";


var firebaseConfig = {
    apiKey: "AIzaSyAYe5tLB2iQ6KK3S9viHpvZcPRY2zAlu1E",
    authDomain: "the-biblioteca-cc12a.firebaseapp.com",
    projectId: "the-biblioteca-cc12a",
    storageBucket: "the-biblioteca-cc12a.appspot.com",
    messagingSenderId: "900222881284",
    appId: "1:900222881284:web:4b7aba908abf849ac66f51"
  };
 


  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();