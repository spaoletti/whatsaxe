import { useCollection } from "react-firebase-hooks/firestore";
import { getModifier } from "../utils";

export default function CharacterSheet(props) {

  function formatModifier(n) {
    return (n <= 0) ? `${n}` : `+${n}`;
  }

  function formatStat(s) {
    const modifier = getModifier(s);
    return `${s} (${formatModifier(modifier)})`;
  }

  const query = props.firestore
    .collection("characters")
    .where("uid", "==", props.user.uid);
  const [sheet] = useCollection(query);

  if (!sheet) {
    return <div>Loading</div>;
  } else if (sheet.empty) {
    return <div>You haven't created a character yet!</div>;
  } else {
    const character = sheet.docs[0].data();
    return <div className="charSheet">
      <div>
        <div>Name</div><div>{character.name}</div>
      </div>
      <div>
        <div>Race</div><div>{character.race}</div>
      </div>
      <div>
        <div>Class</div><div>{character.class}</div>
      </div>
      <div className="space"></div>
      <div>
        <div>Strength</div><div>{formatStat(character.str)}</div>
      </div>
      <div>
        <div>Constitution</div><div>{formatStat(character.con)}</div>
      </div>
      <div>
        <div>Dexterity</div><div>{formatStat(character.dex)}</div>
      </div>
      <div>
        <div>Intelligence</div><div>{formatStat(character.int)}</div>
      </div>
      <div>
        <div>Wisdom</div><div>{formatStat(character.wis)}</div>
      </div>
      <div>
        <div>Charisma</div><div>{formatStat(character.cha)}</div>
      </div>
      <div className="space"></div>
      <div>
        <div>Hit points</div><div>{character.hp} / {character.maxhp}</div>
      </div>
    </div>;  
  }

}