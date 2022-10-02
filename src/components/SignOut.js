export default function SignOut(props) {
  return props.auth.currentUser && (
    <button onClick={() => props.auth.signOut()}>Sign out</button>
  )
}
