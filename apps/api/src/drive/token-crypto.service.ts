import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";

@Injectable()
export class DriveTokenCryptoService {
  private readonly key: Buffer | null;

  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    this.key = environment.DRIVE_TOKEN_ENCRYPTION_KEY
      ? createHash("sha256").update(environment.DRIVE_TOKEN_ENCRYPTION_KEY).digest()
      : null;
  }

  encrypt(value: string): string {
    const key = this.requireKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
  }

  decrypt(value: string): string {
    const key = this.requireKey();
    const [ivEncoded, tagEncoded, encryptedEncoded] = value.split(".");
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
      throw new Error("Malformed encrypted Drive token");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }

  private requireKey(): Buffer {
    if (!this.key) {
      throw new ServiceUnavailableException("Drive token encryption is not configured");
    }
    return this.key;
  }
}
