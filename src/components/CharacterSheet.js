import { useState } from "react";

export default function CharacterSheet(props) {

  const loading = 
    <div>Loading</div>;

  const noCharacter =
    <div>You haven't created a character yet!</div>;

  const character = (stats) => 
    <div className="charSheet">
      <div>
        <div>Name</div><div>{stats.name}</div>
      </div>
      <div>
        <div>Strength</div><div>{stats.str}</div></div>
      <div>
        <div>Constitution</div><div>{stats.con}</div>
      </div>
      <div>
        <div>Dexterity</div><div>{stats.dex}</div>
      </div>
      <div>
        <div>Intelligence</div><div>{stats.int}</div>
      </div>
      <div>
        <div>Wisdom</div><div>{stats.wis}</div>
      </div>
      <div>
        <div>Charisma</div><div>{stats.cha}</div>
      </div>
      <div>
        <div>Hit points</div><div>{stats.hp}</div>
      </div>
    </div>

  const [sheet, setSheet] = useState(loading);

  sheet === loading && props.firestore
    .collection("characters")
    .where("uid", "==", props.user.uid)
    .get().then((r) => 
      setSheet(r.empty ? noCharacter : character(r.docs[0].data()))
    );

  return sheet;
}