export default function PlayersList(props) {

  function render(list) {
    if (!list) {
      return loading;
    } else if (list.length === 0) {
      return noPlayersList;
    } else {
      return playersList(list);
    }
  }

  const loading = 
    <div>Loading</div>;

  const noPlayersList =
    <div>There are no players!</div>;

  const playersList = (list) =>
    <div>
      {list.map((c, idx) => 
        <div key={idx}>{c.name}</div>)}
    </div>

  return render(props.list);
}