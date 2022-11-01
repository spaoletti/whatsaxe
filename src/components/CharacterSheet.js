import { useState } from "react";

export default function CharacterSheet(props) {

  const loading = 
    <div>Loading</div>;

  const noCharacter =
    <div>You haven't created a character yet!</div>;

  const character = (stats) => 
    <div>
      <div>Name {stats.name}</div>
      <div>Strength {stats.strength}</div>
      <div>Constitution {stats.constitution}</div>
      <div>Dexterity {stats.dexterity}</div>
      <div>Intelligence {stats.intelligence}</div>
      <div>Wisdom {stats.wisdom}</div>
      <div>Charisma {stats.charisma}</div>
      <div>Hit points {stats.hit_points}</div>
    </div>


  const [sheet, setSheet] = useState(loading);
  const charactersRef = props.firestore.collection("characters");
  charactersRef
    .where("uid", "==", props.user.uid)
    .get().then((r) => 
      setSheet(r.empty ? noCharacter : character(r.docs[0].data()))
    );

  return sheet;
}