import { useState, useCallback } from "react";

/**
 * Custom hook for handling inline name editing
 * @param {string} initialName - The initial name value
 * @param {function} onSave - Callback when name is saved
 * @returns {object} { isEditing, editName, handlers }
 */
export function useEditableName(initialName, onSave) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initialName);

  const handleNameClick = useCallback(
    (e) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditName(initialName);
    },
    [initialName]
  );

  const handleNameBlur = useCallback(() => {
    setIsEditing(false);
    if (editName.trim() && editName !== initialName) {
      onSave(editName);
    } else {
      setEditName(initialName);
    }
  }, [editName, initialName, onSave]);

  const handleNameKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.target.blur();
      } else if (e.key === "Escape") {
        setEditName(initialName);
        setIsEditing(false);
      }
    },
    [initialName]
  );

  const handleNameChange = useCallback((e) => {
    setEditName(e.target.value);
  }, []);

  return {
    isEditing,
    editName,
    setEditName,
    handlers: {
      onClick: handleNameClick,
      onBlur: handleNameBlur,
      onKeyDown: handleNameKeyDown,
      onChange: handleNameChange,
    },
  };
}
