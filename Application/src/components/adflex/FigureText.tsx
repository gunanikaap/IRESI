import { Fragment } from "react";
import styles from "./FigureText.module.css";

type FigureTextProps = {
  text: string;
  /**
   * A phrase inside `text` to pick out typographically — in practice the
   * figure a sentence turns on, such as "9,000 residents".
   *
   * It must appear verbatim in `text`. If it does not match, the text still
   * renders in full, just without the emphasis, so a content typo degrades to
   * plain prose rather than losing a sentence.
   */
  figure?: string;
};

/**
 * Renders a paragraph with one phrase given typographic emphasis.
 *
 * The emphasis is purely visual, so it uses a plain `<span>` rather than
 * `<strong>`: the numbers are worth catching the eye, but the supplied copy
 * does not mark them as important, and wrapping them in `<strong>` would put
 * emphasis into the sentence that the author did not write.
 */
export function FigureText({ text, figure }: FigureTextProps) {
  if (!figure) return <>{text}</>;

  const start = text.indexOf(figure);
  if (start === -1) return <>{text}</>;

  return (
    <Fragment>
      {text.slice(0, start)}
      <span className={styles.figure}>{figure}</span>
      {text.slice(start + figure.length)}
    </Fragment>
  );
}
