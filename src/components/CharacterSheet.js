import { useCollection } from "react-firebase-hooks/firestore";

export default function CharacterSheet(props) {

  const query = props.firestore
    .collection("characters")
    .where("uid", "==", props.user.uid);
  const [sheet] = useCollection(query);

  if (!sheet) {
    return <div>Loading</div>;
  } else if (sheet.empty) {
    return <div>You haven't created a character yet!</div>;
  } else {
    const stats = sheet.docs[0].data();
    return <div className="charSheet">
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
        <div>Hit points</div><div>{stats.hp} / {stats.maxhp}</div>
      </div>
    </div>;  
  }

}