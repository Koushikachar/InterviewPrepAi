const DeleteAlertContent = ({ content, onDelete, onCancel }) => {
  return (
    <div className="p-5">
      <p className="text-[14px]">{content}</p>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          className="btn-small bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="button" className="btn-small" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlertContent;
