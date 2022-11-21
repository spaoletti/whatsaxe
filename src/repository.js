export function getSnaphotData(snapshot) {
  return snapshot && snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}

export function deleteChats(messagesRef) {
  return messagesRef
    .where('type','==',"chat")
    .get().then((result) => 
      result.forEach((doc) => doc.ref.delete())
    );  
}

export function saveMessage(messagesRef, message, uid, timestamp) {
  messagesRef.add({
    ...message,
    uid,
    createdAt: timestamp
  })  
}

export function resolveRequest(messagesRef, docId) {
  update(messagesRef, docId, { resolved: true });
}

export function updateCharacterHp(charactersRef, docId, newHp) {
  update(charactersRef, docId, { hp: newHp });
}

function update(ref, id, propsToUpdate) {
  ref.doc(id).update(propsToUpdate);
}