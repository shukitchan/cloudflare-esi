import { tagParser } from "./tagParser";

/**
 * Processes chunk of text and handles <!--esi tags
 *
 * @param {string} chunk Chunk of text to process
 * @param {string[]} [res] Array of chunks of text already processed (used internally within function)
 * @param {number} recursion recursion level we are currently at
 * @returns {Promise<string>} processed string
 */
export async function process(
  chunk: string,
  res?: Array<string>,
  recursion?: number
): Promise<string> {
  if (!recursion) {
    recursion = 0;
  }
  if (!res) {
    res = [];
  }

  const parser = new tagParser(chunk);
  let hasEscaping = false;

  do {
    const [tag, before, after] = await parser.next("!--esi");

    if (tag && tag.closing && tag.contents) {
      hasEscaping = true;
      if (before) {
        res.push(before);
      }
      if (tag.contents.search(/<!--esi/) !== -1) {
        return process(tag.contents, res, recursion);
      } else {
        res.push(tag.contents);
        if (after) res.push(after);
      }
    } else if (!tag) {
      break;
    }

    // eslint-disable-next-line no-constant-condition
  } while (true);

  if (hasEscaping) {
    return res.join("");
  } else {
    return chunk;
  }
}
