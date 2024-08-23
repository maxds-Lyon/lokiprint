import jwt from "jsonwebtoken";
import { SignJWT } from "jose";
import axios from "axios";
import FormData from "form-data";
import { basename } from "path";
import * as fs from "fs";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });

const API_BASE_URL = "https://ui.boondmanager.com/api";

async function createToken() {
  this.key = process.env.BOOND_CLIENT_SECRET;
  this.clientToken = process.env.BOOND_CLIENT_TOKEN;
  this.userToken = process.env.BOOND_USER_TOKEN;

  const jwt = await new SignJWT({
    userToken: this.userToken,
    clientToken: this.clientToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(this.key));

  return jwt;
}

async function configureAxiosClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "X-Jwt-Client-BoondManager": await createToken(),
    },
  });
}

async function searchUser(client, name) {
  const params = new URLSearchParams({
    keywords: name,
    keywordsType: "fullname",
  });
  const response = await client.get("/resources", { params });
  return response.data.data?.length === 1 ? response.data.data[0] : null;
}

async function fetchDocuments(client, userId) {
  const response = await client.get(`resources/${userId}/information`);
  return response.data.included.filter((doc) => doc.type === "document");
}

async function deleteDocument(client, documentId) {
  await client.delete(`documents/${documentId}`);
}

async function uploadDocument(client, documentDetails) {
  const { parentId, parentType, file, prefix } = documentDetails;
  const formData = new FormData();
  formData.append("parentType", parentType);
  formData.append("parentId", parentId);
  formData.append("file", fs.createReadStream(file), prefix + basename(file));
  await client.post(`documents`, formData);
}

async function handleUserDocuments(client, userId, documents, documentPrefix) {
  const previousDocuments = await fetchDocuments(client, userId);
  const previousResumes = previousDocuments.filter((doc) =>
    doc.attributes.name.startsWith(documentPrefix)
  );

  for (const doc of previousResumes) {
    await deleteDocument(client, doc.id);
  }

  for (const doc of documents) {
    await uploadDocument(client, {
      parentId: userId,
      parentType: "resourceResume",
      file: doc.file,
      prefix: documentPrefix,
    });
  }
}

async function processDocuments(documents) {
  const client = await configureAxiosClient();
  const documentPrefix = process.env.BOOND_DOCUMENT_PREFIX ?? "lokiprint-";
  const groupedDocuments = Object.groupBy(
    documents.filter((doc) => doc.status === "success"),
    (doc) => doc.data.profile.name
  );

  for (const [username, userDocuments] of Object.entries(groupedDocuments)) {
    logger.info(`Processing user ${username}`);
    const user = await searchUser(client, username);
    if (!user) {
      logger.warn(`Could not find user ${username}`);
      continue;
    }

    await handleUserDocuments(client, user.id, userDocuments, documentPrefix);
    logger.info(
      `Uploaded ${userDocuments.length} documents for user ${username}`
    );
  }

  logger.info("Successfully uploaded to Boond.");
}

export function notifyBoond(argv) {
  if (String(argv.b ?? argv.boond) === "true") {
    return () => processDocuments;
  }
  return () => Promise.resolve();
}
