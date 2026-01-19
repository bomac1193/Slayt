// Shared state for tracking internal preview drags
// This prevents the file upload overlay from appearing during internal item drags

let internalDragActive = false;

export const setInternalDragActive = (active) => {
  internalDragActive = active;
};

export const isInternalDragActive = () => {
  return internalDragActive;
};
