import { promises as fs } from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { join } from "path";

export const createValidate = async () => {
  const schema = JSON.parse(
    await fs.readFile(join(import.meta.dirname, "people.schema.json"), "utf-8")
  );
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
};
