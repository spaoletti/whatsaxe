import './App.css'
import React from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import SignIn from './components/SignIn';
import SignOut from './components/SignOut';
import GameRoom from './components/GameRoom';

const firebaseConfig = {
  apiKey: "AIzaSyC6J82sRFdawN4miLvzcKKtAfSvG11k1t8",
  authDomain: "whatsaxe-78703.firebaseapp.com",
  projectId: "whatsaxe-78703",
  storageBucket: "whatsaxe-78703.appspot.com",
  messagingSenderId: "1067470074651",
  appId: "1:1067470074651:web:b388a0f0d7d51d12e4d9be"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header className="App-header">
        <div className='logo'>
          <img src="./whatsaxe.png" /><div>WhatsAxe</div>
        </div>
        {user && <SignOut auth={auth} />}
      </header>
      <section>
        {user ? <GameRoom firebase={firebase} firestore={firestore} auth={auth} /> : <SignIn auth={auth} />}
      </section>
    </div>
  );
}

export default App;
