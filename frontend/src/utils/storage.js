const parseJSON = (v) => {
  try {
    return JSON.parse(v);
  } catch (e) {
    return null;
  }
};

export function saveToLocalStorage(key, value) {
  const item = {
    value,
  };
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    // ignore quota errors
  }
}

export function loadFromLocalStorage(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const item = parseJSON(raw);
  if (!item) return null;
  return item.value;
}

export default {
  saveToLocalStorage,
  loadFromLocalStorage,
};
