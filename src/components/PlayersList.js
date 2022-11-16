import { useCollection } from "react-firebase-hooks/firestore";

export default function PlayersList(props) {

  function render(list) {
    if (!list) {
      return <div>Loading</div>;
    } else if (list.empty) {
      return <div>There are no players!</div>;
    } else {
      return <div>
        {list.docs.map((c, idx) => <div key={idx}>{c.data().name}</div>)}
      </div>;
    }
  }

  const query = props.firestore.collection("characters");
  const [characterList] = useCollection(query);

  return render(characterList);
  
}