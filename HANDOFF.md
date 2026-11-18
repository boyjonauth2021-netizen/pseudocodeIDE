# OnlineIDE: Handoff

Last updated: 18 Nov 2026

## Project overview

Free browser-based tools for Cambridge CS students, run by Mr Boyjonauth (Goodlands, Mauritius).

- **Live site:** https://pseudocode-web.com
- **Live repo:** `boyjonauth2021-netizen/pseudocodeIDE` on GitHub (GitHub Pages). Files are uploaded manually through the GitHub web UI.
- **Local working copy:** `Projects/composer2/OnlineIDE/`, also committed to `Bojo2025/composer2` on branch `cursor/jerushajump-stage-one` (commit `6ab4514`).

Important: committing to `composer2` does **not** update the live site. Upload the changed files to `pseudocodeIDE` separately.

## Files

| File | Purpose | Live? |
|---|---|---|
| `index.html` | Pseudocode IDE (main page) | Yes |
| `sql-ide.html` | CIE 9618 SQL editor (sql.js) | Yes |
| `sql-reference.html` | SQL student reference | Yes |
| `pseudocode-reference.html` | Pseudocode language reference | Yes |
| `datarepp3.html` | Paper 3 §13.1 data types (composite / non-composite) with runnable examples | Yes |
| `python-ide.html` | Paper 4 console Python IDE (Pyodide, syllabus subset) | Yes, upload with the updated `index.html` |
| `python-reference.html` | Short Paper 4 Python notes | Yes |
| `list-pseudocodes.html` | Examples list | Yes |
| `privacy-policy.html` | Privacy policy (AdSense / GA disclosure) | Yes |
| `ads.txt` | AdSense authorised sellers line | Yes (root) |
| `sitemap.xml` | Sitemap for search engines | Yes |
| `robots.txt`, `CNAME`, `googleaf0f3d58c9c43339.html` | Hosting / Search Console | Yes, do not change |
| `js/sql-engine.js` | SQL engine: syllabus validator, sql.js wrapper, schema manager | Yes (in `js/`) |
| `js/sql-samples.js` | Sample databases: school, library, tuition | Yes (in `js/`) |
| `Latest_index.html` | Test copy of `index.html` | **No**, do not upload |
| `SQL-9618-reference.md` | Internal SQL syllabus spec | **No** |
| `IdeCsPseudocode.html` | Older copy, out of scope | Not touched |

## What was done (chronological summary)

1. **Pseudocode IDE features:** DECLARE type dropdown, red wavy underlines for misspelled keywords (no hover tooltips), CIE insert functions (`RAND`, `IS_NUM`, `NUM_TO_STR`, `STR_TO_NUM`, `TO_UPPER`, `TO_LOWER`, `UCASE`, `LCASE`), `SUBSTRING` as alias for `MID`.
2. **Live OUTPUT:** OUTPUT lines now appear as the program runs (`pushOutput` / `flushLiveOutput`). The INPUT prompt shows the last few output lines, so feedback such as "Too high" is visible before the next input.
3. **SQL IDE:** separate page `sql-ide.html` with the engine in `js/`. Exam mode is the default; Textbook mode is lenient. Out-of-syllabus statements are rejected (DROP, LEFT/RIGHT/FULL JOIN, HAVING, LIMIT, UNION, subqueries, CREATE INDEX, AUTO_INCREMENT, backticks).
   - `ALTER TABLE ... ADD PRIMARY KEY` and `ADD FOREIGN KEY` are emulated by rebuilding the table, because SQLite doesn't support them directly.
   - Sample scripts: School, Library, and Tuition.
4. **AdSense:** Publisher ID **`ca-pub-3635078997966836`** (note the digits `...99 7966836`).
   - Added to `<head>` on every page as both the `adsbygoogle.js` script and the `<meta name="google-adsense-account">` tag.
   - `ads.txt` contains `google.com, pub-3635078997966836, DIRECT, f08c47fec0942fa0`.
   - Privacy policy page and footer links added.
   - **Status (Nov 2026):** site approved. Prefer **manual** units (Auto ads OFF for this site so ads do not cover the IDE).
   - Manual unit **`pseudocode-footer`**, slot **`7168611717`**, placed below editor/output (IDE pages) or above the footer (reference / examples / datarepp3). Not on `privacy-policy.html`.
5. **Paper 3 §13.1 user-defined types (Nov 2026)** in `index.html` / `Latest_index.html` / `pseudocode-reference.html`:
   - **Enumerated:** `TYPE Season = (Spring, Summer, …)` — ordered identifiers, assign/compare, `value + 1` / `value - 1`.
   - **Pointer:** `TYPE P = ^BaseType`, `ptr ← ^var`, read `ptr^`, write `ptr^ ← value`.
   - **Set:** `TYPE S = SET OF BaseType` then `DEFINE name (…values…) : S`, membership with `IN`, plus `UNION` / `INTERSECTION` / `DIFFERENCE` (same set type).
   - Records still use `TYPE` / `ENDTYPE` (name on same line or next line).
   - Spec sources: Hodder Ch 13.1 and https://moshikur.com/a2-level/a2-ch13-data-representation/13-1-user-defined-data-types/
   - Classes/OOP (`CLASS` / `PRIVATE`) are **not** implemented (syllabus detail is in Ch 20).
6. **`datarepp3.html` (Nov 2026):** teaching page for composite vs non-composite types; every practice block was smoke-tested in the IDE. Array-of-records field write uses a temp record then `Catalogue[i] ← Item` (direct `Catalogue[i].Field ←` is not supported yet).
7. **Paper 4 Python IDE (Nov 2026)** in `python-ide.html` / `python-reference.html`, linked from `index.html`, `Latest_index.html` and `sql-ide.html`:
   - Console subset only: assignment, `input` / `print`, `int` / `float` / `str` / `bool`, `if` / `elif` / `else`, `for` / `range`, `while`, `def` / `return`, lists and `append`, classes (`__init__`, `self`, inheritance), files (`open` r/w/a), `try` / `except`, recursion.
   - Rejected: `import`, `lambda`, comprehensions, decorators, `:=`, and the other tokens in `FORBIDDEN`. No `CASE` and no `REPEAT…UNTIL`.
   - Same editor techniques as the pseudocode IDE: coloured Python, red wavy underlines for near-miss keywords, suggestion menu for names, CIE functions, `print(` / `input(` quotes, `list.`, `object.` methods (including inherited methods) and `self.` attributes. Ctrl+Space, arrows, Enter, Tab, Esc.
   - CIE helpers injected before the student’s code: `LENGTH`, `LEFT`, `RIGHT`, `MID` / `SUBSTRING`, `INT`, `ASC`, `CHR`, `SQUAREROOT`, `RANDOM`, `ROUND`, `RND`, `RAND`, `DIV`, `MOD`, `IS_NUM`, `NUM_TO_STR`, `STR_TO_NUM`, `TO_UPPER` / `TO_LOWER` / `UCASE` / `LCASE`, `EOF`.
   - Runtime is Pyodide 0.26.4, loaded on the first Run. The first load needs a network connection.

## Known issues and gotchas

- **Publisher ID typo (fixed 22 Oct):** the files had `...366836` instead of `...966836`. This blocked AdSense verification for about a day. Always check the ID against the AdSense dashboard before uploading.
- **Upload before verifying:** verify only after the uploaded files are live. Check with `curl https://pseudocode-web.com/ads.txt`.
- **IDE keyword linter:** `READ` / `WRITE` / `APPEND` (used in `OPENFILE ... FOR READ`) are underlined in red as misspellings of `REAL` / `WRITE`. The code still runs. Adding them to `PSEU_KW` would fix the underline.
- **Case-sensitive variables:** `Found` and `found` are different variables. Mixed-case names in one program produce "Invalid expression" errors.
- **`IF` needs `THEN`:** the IDE requires `THEN` after every `IF` condition (on the same line or the next).
- **Ads policy:** do not click your own ads or ask students to click them.

## Pending / next steps

1. Monitor the AdSense review (Sites page or email). If it is rejected, read the reason and fix it.
2. Manual ads: unit `pseudocode-footer` (`7168611717`) is in the HTML. Keep Auto ads OFF for `pseudocode-web.com`. Ads may take minutes–hours to fill after upload.
3. Optional: add `READ`, `WRITE`, `APPEND` to the keyword list so they stop being underlined.
4. Optional: add the 8 uploaded files to Search Console if indexing is slow.

## Deploy checklist (live site)

1. Edit files in `Projects/composer2/OnlineIDE/`.
2. Check the Publisher ID with `grep -rn "ca-pub-" .` and `cat ads.txt`.
3. Upload the changed files to `boyjonauth2021-netizen/pseudocodeIDE` (root level, replacing the old files). For the Python IDE that is `python-ide.html`, `python-reference.html`, `index.html` and `sitemap.xml`. Do not upload `Latest_index.html`, `SQL-9618-reference.md`, or this `HANDOFF.md`.
4. Wait about 2 minutes, then check `https://pseudocode-web.com/` in a private window.
5. Commit to `composer2` if needed (`git add OnlineIDE/`). Only add the OnlineIDE folder, because the rest of the repo has unrelated changes.
