import './App.css'
import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import SignIn from './components/SignIn';
import SignOut from './components/SignOut';
import GameRoom from './components/GameRoom';
import { isDM } from './utils';
import { slide as Menu } from 'react-burger-menu'
import CharacterSheet from './components/CharacterSheet';
import Inventory from './components/Inventory';

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

function storeUser(user) {
  const document = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  }
  firestore.collection("users").doc(user.uid).set(document);
}

function App() {

  const [user] = useAuthState(auth);

  const signIn = 
    <SignIn auth={auth} />

  const gameRoom = 
    <GameRoom 
      firebase={firebase} 
      firestore={firestore} 
      user={user} 
    />;

  const characterSheet = 
    <CharacterSheet
      firestore={firestore}
      user={user} 
    />;

  const inventory = 
    <Inventory/>;

  const [page, setPage] = useState();

  useEffect(() => {
    if (user) {
      storeUser(user);
      setPage(gameRoom);
    } else {
      setPage(signIn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="App">
      <header className="App-header">
        {user && <Menu>
          <div onClick={() => {setPage(gameRoom)}}>Game room</div>
          <div onClick={() => {setPage(characterSheet)}}>Character sheet</div>
          <div onClick={() => {setPage(inventory)}}>Inventory</div>
        </Menu>}
        <div className='logo'>
          <img alt='whatsaxe' src="./whatsaxe.png" /><div>WhatsAxe</div>
        </div>
        {user && isDM(user) && <div>You are the DM</div>}
        {user && <SignOut auth={auth} />}
      </header>
      <section>
        {page}
      </section>
    </div>
  );
}

export default App;
