# Yield Calculator — web version

Password-protected web version of the yield calculation (replaces `YieldCalculation.xlsx`):
yield and coefficient per batch, per woodtype, with expected-yield and coefficient flags.

GitHub Pages is static hosting, so the login cannot run on a server. The app itself is
**encrypted** (AES-256-GCM, key derived from the password with PBKDF2-SHA256, 600,000 iterations).
`index.html` only contains the login page and the encrypted app; without the password nothing
readable is published. The readable source is **not** in this repository.

Data entered in the app is stored in the visitor's own browser (localStorage); use Backup (JSON) in the app to move or keep it.

## Update or change the password

```bash
YIELD_PASSWORD='new-or-same-password' node build.mjs "<path to yield-calculator.html>"
git add index.html && git commit -m "Update web version" && git push
```

Every build uses a new salt and IV; anyone still logged in has to log in again.
