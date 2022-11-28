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
import { config } from './config';

const env = process.env.REACT_APP_ENV ? process.env.REACT_APP_ENV : "dev";

firebase.initializeApp(config[env]);

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
