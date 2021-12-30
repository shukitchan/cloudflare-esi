/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { tagParser } from "./tagParser";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// eslint-disable-next-line @typescript-eslint/ban-types
export function create(writer: Function) {

	let tag_hint: string | null
	let prev_chunk = "";

	return async function ({ value, done }: { value: string, done: boolean }) {

		if (tag_hint) {
			value = tag_hint + value
			tag_hint = null
		}

		value = prev_chunk + value

		const parser = new tagParser(value);
		do {
			const [tag, before, after] = await parser.next()

			if (tag && tag.whole) {
				if (before) {
					writer(before, false)
				}
				writer(tag.whole, true)

				value = after as string
				prev_chunk = ""
			} else if (tag && !tag.whole) {
				if (typeof before == "string" && before.length !== 0) {
					writer(before, false)
				}

				prev_chunk = tag.opening.tag + after
				break
			} else {
				const incompleteTag = value.search(/<(?:!--)?esi/);
				if (incompleteTag !== -1) {
					break
				}

				const hintMatch = value.slice(-6).match(/(?:<!--es|<!--e|<!--|<es|<!-|<e|<!|<)$/)
				if (hintMatch) {
					tag_hint = hintMatch[0]
					value = value.substring(0, value.length - tag_hint.length)
				}
				if (typeof value == "string" && value.length !== 0) {
					writer(value, false)
				}
				break
			}

			// eslint-disable-next-line no-constant-condition
		} while (true)

		// Check if we had something left over
		// But we didnt write it
		if (done) {
			if (typeof prev_chunk == "string" && prev_chunk.length !== 0) {
				writer(prev_chunk, false)
			}
		}
	}
}
