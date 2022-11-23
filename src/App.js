import './App.css'
import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import SignIn from './components/SignIn';
import GameRoom from './components/GameRoom';
import { isDM, isPlayer } from './utils';
import { slide as Menu } from 'react-burger-menu'
import CharacterSheet from './components/CharacterSheet';
import PlayersList from './components/PlayersList';
import Spinner from './components/Spinner';

// prod
// const firebaseConfig = {
//   apiKey: "AIzaSyC6J82sRFdawN4miLvzcKKtAfSvG11k1t8",
//   authDomain: "whatsaxe-78703.firebaseapp.com",
//   projectId: "whatsaxe-78703",
//   storageBucket: "whatsaxe-78703.appspot.com",
//   messagingSenderId: "1067470074651",
//   appId: "1:1067470074651:web:b388a0f0d7d51d12e4d9be"
// };

// test
const firebaseConfig = {
  apiKey: "AIzaSyCPpQbdT92wX8aRb_wvyp0iclVIGMyN_Hs",
  authDomain: "whatsaxe-dev.firebaseapp.com",
  projectId: "whatsaxe-dev",
  storageBucket: "whatsaxe-dev.appspot.com",
  messagingSenderId: "895216685697",
  appId: "1:895216685697:web:b3c73be313e8f0c986f380"
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

  const [user, loading] = useAuthState(auth);
  const [page, setPage] = useState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      storeUser(user);
      setPage("gameRoom");
    } else {
      setPage("signIn");
    }
  }, [user]);

  function render(page) {
    if (!user) {      
      return loading ? <Spinner/> : <SignIn auth={auth} />;
    }
    switch (page) {
      case "gameRoom":
        return <GameRoom 
          firebase={firebase} 
          firestore={firestore} 
          user={user}
        />;
      case "characterSheet":
        return <CharacterSheet
          firestore={firestore}
          user={user} 
        />;    
      case "party":
        return <PlayersList
          firestore={firestore}
          user={user}
        />;  
      default:
        return <></>;
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {user && 
          <Menu isOpen={isMenuOpen} onStateChange={s => setIsMenuOpen(s.isOpen)}>
            <div onClick={() => {handleMenuClick("gameRoom")}}>Game room</div>
            {isPlayer(user) && <div onClick={() => {handleMenuClick("characterSheet")}}>Character sheet</div>}
            <div onClick={() => {handleMenuClick("party")}}>Party</div>
            <div onClick={() => auth.signOut()}>Sign out</div>
          </Menu>
        }
        <div className='logo'>
          <img alt='whatsaxe' src="./whatsaxe.png" /><div>WhatsAxe</div>
        </div>
        {user && isDM(user) && <div>You are the DM</div>}
      </header>
      <section>
        {render(page)}
      </section>
    </div>
  );
}

export default App;
