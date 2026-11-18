// Builds the password-protected web version of the Yield Calculator.
//
//   YIELD_PASSWORD='…' node build.mjs "/path/to/yield-calculator.html"
//
// The readable app never enters this repository: it is encrypted (AES-256-GCM, key from the
// password via PBKDF2-SHA256) and embedded in the login page, which is written to index.html —
// the only file GitHub Pages serves to visitors.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, pbkdf2Sync, createCipheriv, createHash } from "node:crypto";

const source = process.argv[2];
const password = process.env.YIELD_PASSWORD;
if (!source || !password) {
  console.error('Usage: YIELD_PASSWORD=\'…\' node build.mjs "<path to yield-calculator.html>"');
  process.exit(1);
}
const ITERATIONS = 600000;
const html = readFileSync(source, "utf8");
if (html.includes("�")) { console.error("Source contains a replacement character (U+FFFD) — fix first."); process.exit(1); }

// The salt is generated once and kept in salt.txt (it is public anyway: it also sits inside index.html).
// A fixed salt keeps the derived key the same between builds, so "remember me" survives updates of the app.
// Changing the password changes the key, so remembered logins then ask for the new password.
const saltFile = new URL("./salt.txt", import.meta.url);
if (!existsSync(saltFile)) writeFileSync(saltFile, randomBytes(16).toString("base64"));
const salt = Buffer.from(readFileSync(saltFile, "utf8").trim(), "base64"), iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(html, "utf8"), cipher.final(), cipher.getAuthTag()]); // WebCrypto wants the tag appended
const payload = {
  id: createHash("sha256").update(ct).digest("hex").slice(0, 12), // per build, so an old session key is not reused
  iter: ITERATIONS, salt: salt.toString("base64"), iv: iv.toString("base64"), ct: ct.toString("base64"),
};
const template = readFileSync(new URL("./login.template.html", import.meta.url), "utf8");
const marker = "/*__PAYLOAD__*/null";
if (!template.includes(marker)) { console.error("Marker missing in login.template.html"); process.exit(1); }
writeFileSync(new URL("./index.html", import.meta.url), template.replace(marker, JSON.stringify(payload)));
console.log(`index.html written — ${(ct.length / 1024).toFixed(0)} KB encrypted, build ${payload.id}`);
