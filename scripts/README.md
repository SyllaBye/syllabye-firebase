# Importing a New Semester

Each semester, the registrar sends a CSV of course offerings and the professors
teaching them. The `importSemester` Cloud Function loads it into Firestore.
`runSemesterImport.js` sends the CSV to that function.

Only members of the Firebase project can run an import: the function is private,
and Google rejects anyone else before the code runs.

## What you need installed

| Tool | Why | Check |
|---|---|---|
| **Node.js 18+** | Runs the script | `node --version` |
| **gcloud CLI** | Proves you're a project member | `gcloud --version` |

Then log in once with the Google account that's a member of the Firebase project:

```
gcloud auth login
gcloud auth list        # the active account should be your project account
```

Install gcloud from <https://cloud.google.com/sdk/docs/install>
(on Windows: `winget install Google.CloudSDK`, then restart your terminal).

Your account needs **Owner** or **Editor** on the project (or the **Cloud Run Invoker** role).
`scripts/` has no npm dependencies; no `npm install` is needed there.

## Importing a semester

Run all commands from the repo root.

1. **Put the CSV in `scripts/data/`.** This folder is gitignored, since the file
   contains professors' names and emails. Close it in Excel before importing
   (Excel locks the file).

2. **Dry run.** This checks the file and shows what *would* be written. Nothing is changed.

   ```
   node scripts/runSemesterImport.js "scripts/data/<semester file>.csv"
   ```

   Read the plan: course and user counts, and `newSubjects`. If validation fails,
   the reply lists each problem by row number; fix the CSV and run the dry run again.

3. **Tell the team** you're about to import. There's one Firestore database shared
   by every version of the app, and only one import should run at a time.

4. **Import:**

   ```
   node scripts/runSemesterImport.js "scripts/data/<semester file>.csv" --commit
   ```

   Expect `"Import complete"`. If some writes fail, the reply lists them; fix the
   cause and run the same command again. Reruns are safe.

5. **Name any new subjects.** Subjects listed in `newSubjects` were created with
   their code as a placeholder name (e.g. `DATA`). Add their real names in the
   Firebase console under `subjects`.

## CSV requirements

- One semester per file, with `TERM` like `SPRING 2027` (seasons: SPRING, SUMMER, FALL).
- Required columns: `TERM`, `SUBJECT`, `COURSE NO.`, `SECTION NO.`, `PERIOD DESC`,
  `COURSE NAME`, `LAST NAME`, `FIRST NAME`, `EMAIL ADDRESS`. Other columns are ignored.
- A section with no professor yet must have all three instructor columns blank.
  Partially filled instructor info is an error.
- Each subject + course number + section may appear only once.
- Any error rejects the whole file; nothing is imported.

Column names are defined in `COLUMNS` in
`functions/src/firestoreOperations/importSemester/importLogic.js`.
If the registrar renames a column, update it there.

## What an import does and doesn't do

**Does:**
- Creates missing semesters, periods, subjects, section codes, courses, users, and offerings.
- New users get `activeProfessor: true`. New offerings get `statusKey: "NOT_UPLOADED"`.
- Updates a course's name if the CSV's name changed.
- Updates existing offerings' links (course, section, period, professor).

**Doesn't:**
- Overwrite `statusKey`, `lastReminder`, or other data the app adds to offerings.
- Change existing users' names or `activeAdmin`. Admins are assigned manually.
- Delete anything, or clear a professor who was removed from a section.
- Create duplicates: existing courses, users, and offerings are found and reused.

## Testing locally (emulator)

Requires the Firebase CLI, Java, and `npm ci` in `functions/`.

```
firebase emulators:start --only functions,firestore --import=./emulator-data
```

Add `--emulator` to any script command to target the emulator instead of the real
project. No gcloud login is needed, and nothing touches the real database.

```
node scripts/runSemesterImport.js "scripts/data/<semester file>.csv" --emulator
```

The emulator's database must contain `offering-statuses/NOT_UPLOADED`.
Unit tests: `cd functions && node --test`.

## Deploying the function

Cloud Functions are deployed separately from the website. After changes to
`importSemester`, deploy it from up-to-date code:

```
cd functions && npm ci && cd ..
firebase deploy --only functions:firestoreOperations.importSemester
```

Then confirm in Google Cloud console > Cloud Run > the import service > Security
that it **requires authentication** and `allUsers` is not an invoker.

## Troubleshooting

| Problem | Fix |
|---|---|
| `401` / `403`, "Not authorized" | `gcloud auth login` with a project-member account; check `gcloud auth list` |
| `404` | The function isn't deployed (see above) |
| `gcloud` is not recognized | Install gcloud, then fully restart your terminal |
| "being used by another process" | Close the CSV in Excel |
| "Could not read the CSV" | A row has the wrong number of commas; to blank a value, keep its commas |
| "Could not read Firestore" (emulator) | Start the emulator with both `functions,firestore` |
| `Cannot find module 'csv-parse/sync'` | Run `npm ci` in `functions/` |

## Credit  
This README was generated by Claude and was verified and modified by the developer.
