// PatchNotePreview — props copied from src/components/features/PatchNotePreview.tsx (the source keeps the interface unexported). Documentation only; not type-checked.

export interface PatchNotePreviewProps {
  /** Announcement title from the admin form; trimmed. Empty → 제목을 입력하세요 in italic gray-400. The notification row shows "새로운 업데이트: " + the first 50 chars + "..." when longer. */
  title: string;
  /** Announcement body from the admin form; trimmed. Empty → 내용을 입력하세요 in italic gray-400. Rendered with whitespace-pre-wrap inside a 256px-capped scroll area (max-h-64). */
  content: string;
  /** Optional version label (the form placeholder is v1.0.0); trimmed and shown as a blue-100 / blue-700 pill only when non-empty. */
  version?: string;
}

/** Client component. Pure render of its props: no state, no fetching, no handlers. The admin patch-notes page mounts it as the second column of a grid next to the form while 미리보기 is toggled on. */
export declare function PatchNotePreview(props: PatchNotePreviewProps): JSX.Element;
