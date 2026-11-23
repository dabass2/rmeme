import { config } from "../config";

export const memeUrl = (filename: string, extension: string) =>
  `${config.hostedFileBasePath}/${filename}.${extension}`;
