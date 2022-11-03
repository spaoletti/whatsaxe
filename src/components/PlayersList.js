import { useState } from "react";

export default function PlayersList(props) {

  const loading = 
    <div>Loading</div>;

  const noPlayersList =
    <div>There are no players!</div>;

  const playersList = (list) => 
    <div>
      { list.map(c => <div>{c.name}</div>) }
    </div>

  const [list, setList] = useState(loading);

  list === loading && props.firestore
    .collection("characters")
    .get().then(r => {
      console.log(r);
      setList(r.empty ? noPlayersList : playersList(r.docs.map(d => d.data())))
    });

  return list
}