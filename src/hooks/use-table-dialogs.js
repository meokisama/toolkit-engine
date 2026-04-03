import { useReducer, useCallback } from "react";

const initialState = {
  crud: { open: false, mode: "create", item: null },
  confirm: { open: false, title: "", description: "", onConfirm: null, loading: false },
  bulkDelete: { open: false, items: [], loading: false },
  import: { open: false },
};

function reducer(state, action) {
  switch (action.type) {
    case "OPEN_CREATE":
      return { ...state, crud: { open: true, mode: "create", item: null } };
    case "OPEN_EDIT":
      return { ...state, crud: { open: true, mode: "edit", item: action.item } };
    case "CLOSE_CRUD":
      return { ...state, crud: { ...state.crud, open: false, item: null } };
    case "OPEN_CONFIRM":
      return { ...state, confirm: { open: true, title: action.title, description: action.description, onConfirm: action.onConfirm, loading: false } };
    case "CLOSE_CONFIRM":
      return { ...state, confirm: { ...state.confirm, open: false } };
    case "SET_CONFIRM_LOADING":
      return { ...state, confirm: { ...state.confirm, loading: action.loading } };
    case "OPEN_BULK_DELETE":
      return { ...state, bulkDelete: { open: true, items: action.items, loading: false } };
    case "CLOSE_BULK_DELETE":
      return { ...state, bulkDelete: { ...state.bulkDelete, open: false, items: [] } };
    case "SET_BULK_DELETE_LOADING":
      return { ...state, bulkDelete: { ...state.bulkDelete, loading: action.loading } };
    case "OPEN_IMPORT":
      return { ...state, import: { open: true } };
    case "CLOSE_IMPORT":
      return { ...state, import: { open: false } };
    default:
      return state;
  }
}

/**
 * Consolidated dialog state for table components.
 * Replaces 8-16 individual useState calls with a single useReducer.
 *
 * @returns {{ crud, confirm, bulkDelete, import: importDialog, openCreate, openEdit, closeCrud, openConfirm, closeConfirm, setConfirmLoading, openBulkDelete, closeBulkDelete, setBulkDeleteLoading, openImport, closeImport }}
 */
export function useTableDialogs() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // CRUD dialog actions
  const openCreate = useCallback(() => dispatch({ type: "OPEN_CREATE" }), []);
  const openEdit = useCallback((item) => dispatch({ type: "OPEN_EDIT", item }), []);
  const closeCrud = useCallback(() => dispatch({ type: "CLOSE_CRUD" }), []);

  // Generic confirm dialog actions (covers single delete, bulk delete, or any confirm)
  const openConfirm = useCallback(({ title, description, onConfirm }) => {
    dispatch({ type: "OPEN_CONFIRM", title, description, onConfirm });
  }, []);
  const closeConfirm = useCallback(() => dispatch({ type: "CLOSE_CONFIRM" }), []);
  const setConfirmLoading = useCallback((loading) => dispatch({ type: "SET_CONFIRM_LOADING", loading }), []);

  // Bulk delete dialog actions (for tables with dedicated bulk delete UI)
  const openBulkDelete = useCallback((items) => dispatch({ type: "OPEN_BULK_DELETE", items }), []);
  const closeBulkDelete = useCallback(() => dispatch({ type: "CLOSE_BULK_DELETE" }), []);
  const setBulkDeleteLoading = useCallback((loading) => dispatch({ type: "SET_BULK_DELETE_LOADING", loading }), []);

  // Import dialog actions
  const openImport = useCallback(() => dispatch({ type: "OPEN_IMPORT" }), []);
  const closeImport = useCallback(() => dispatch({ type: "CLOSE_IMPORT" }), []);

  return {
    // State
    crud: state.crud,
    confirm: state.confirm,
    bulkDelete: state.bulkDelete,
    importDialog: state.import,
    // CRUD actions
    openCreate,
    openEdit,
    closeCrud,
    // Confirm actions
    openConfirm,
    closeConfirm,
    setConfirmLoading,
    // Bulk delete actions
    openBulkDelete,
    closeBulkDelete,
    setBulkDeleteLoading,
    // Import actions
    openImport,
    closeImport,
  };
}
