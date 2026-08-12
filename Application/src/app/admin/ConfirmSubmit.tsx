"use client";

import { useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import styles from "./admin.module.css";

type ConfirmSubmitProps = {
  /** The heading. A question naming the thing: “Delete “Pilot results”?” */
  title: string;
  /** What will actually happen. Not "are you sure?". */
  detail: string;
  /** The wording on the button that goes through with it. */
  confirmLabel: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  className?: string;
  pendingLabel?: string;
  children: React.ReactNode;
};

/**
 * A submit button that opens a real dialogue first.
 *
 * Used for the actions a mis-click makes expensive: deleting an entry, and
 * putting one on — or taking one off — the public site.
 *
 * ---------------------------------------------------------------------------
 * WHY `<dialog>` AND NOT A DIV
 * ---------------------------------------------------------------------------
 * `showModal()` gives the things a hand-built modal has to reimplement, and
 * usually reimplements badly: focus moves into the dialogue and is trapped
 * there, everything behind it goes inert to both pointer and screen reader,
 * Escape closes it, and the backdrop is a real `::backdrop` rather than an
 * overlay div that has to be stacked correctly. None of that is written here
 * because none of it needs to be.
 *
 * This replaced `window.confirm`, which worked but could not be styled, looked
 * like a browser error, and on some browsers shows the page's origin above the
 * message.
 *
 * **The submit is deliberate.** The button is `type="button"`, so it cannot
 * submit by itself; confirming calls `requestSubmit()` on the owning form,
 * which runs the Server Action exactly as a normal submit would. That is also
 * why this degrades honestly with no JavaScript: the button does nothing at
 * all rather than silently deleting something without asking.
 *
 * The guard is a guard against accidents, not authorisation — that is
 * `requireEditor()` inside the action itself.
 */
export function ConfirmSubmit({
  title,
  detail,
  confirmLabel,
  destructive = false,
  className,
  pendingLabel,
  children,
}: ConfirmSubmitProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();
  const titleId = useId();
  const detailId = useId();

  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
    // Focus goes back where it came from. Without this it lands on <body> and
    // a keyboard user has to tab from the top of the page again.
    triggerRef.current?.focus();
  };

  const confirm = () => {
    const form = triggerRef.current?.closest("form");
    dialogRef.current?.close();
    setOpen(false);
    form?.requestSubmit();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
      >
        {pending && pendingLabel ? pendingLabel : children}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={detailId}
        // Fires on Escape as well as on close(), so the state and the element
        // cannot drift apart.
        onClose={() => setOpen(false)}
        // A dialog opened with showModal() puts the backdrop *on the dialog
        // element itself*, so a click on the backdrop targets the dialog. This
        // is how "click outside to dismiss" is detected without an overlay div.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {open ? (
          <div className={styles.dialogBody}>
            <h2 id={titleId} className={styles.dialogTitle}>
              {title}
            </h2>
            <p id={detailId} className={styles.dialogDetail}>
              {detail}
            </p>

            <div className={styles.dialogActions}>
              {/* Cancel first in the DOM, so it takes initial focus and Enter
                  on an unread dialogue backs out rather than going through. */}
              <button type="button" className={styles.dialogCancel} onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className={destructive ? styles.dialogDanger : "adflex-cta"}
                onClick={confirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
