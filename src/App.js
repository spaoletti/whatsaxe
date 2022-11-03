import './App.css'
import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import SignIn from './components/SignIn';
import SignOut from './components/SignOut';
import GameRoom from './components/GameRoom';
import { isDM, isPlayer } from './utils';
import { slide as Menu } from 'react-burger-menu'
import CharacterSheet from './components/CharacterSheet';
import PlayersList from './components/PlayersList';

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

  function storeUser(user) {
    const document = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    }
    firestore.collection("users").doc(user.uid).set(document);
  }  

  function handleMenuClick(page) {
    setPage(page);
    setIsMenuOpen(false);
  }

  const [user] = useAuthState(auth);
  const [page, setPage] = useState(<div>Loading</div>);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [charactersList, setCharactersList] = useState();

  !charactersList && firestore
    .collection("characters")
    .get().then(r => 
      setCharactersList(r.empty ? [] : r.docs.map(d => d.data()))
    );

  const signIn = 
    <SignIn auth={auth} />;

  const gameRoom = 
    <GameRoom 
      firebase={firebase} 
      firestore={firestore} 
      user={user}
      characters={charactersList} 
    />;

  const characterSheet = 
    <CharacterSheet
      firestore={firestore}
      user={user} 
    />;

  const characters =
    <PlayersList
      list={charactersList}
    />

  useEffect(() => {
    if (user) {
      storeUser(user);
      setPage(gameRoom);
    } else {
      setPage(signIn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setPage(gameRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charactersList])

  return (
    <div className="App">
      <header className="App-header">
        {user && 
          <Menu isOpen={isMenuOpen} onStateChange={s => setIsMenuOpen(s.isOpen)}>
            <div onClick={() => {handleMenuClick(gameRoom)}}>Game room</div>
            {isPlayer(user) && <div onClick={() => {handleMenuClick(characterSheet)}}>Character sheet</div>}
            <div onClick={() => {handleMenuClick(characters)}}>Party</div>
          </Menu>
        }
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
