import firebase from 'firebase/compat/app';

export default function SignIn(props) {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    props.auth.signInWithPopup(provider);
  }

  return (
    <div><button onClick={signInWithGoogle}>Sign in with Google</button></div>
  )
}
