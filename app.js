import { open, readdir } from "node:fs/promises";
import http from "node:http";
import mime from 'mime-types';
import { createWriteStream, ReadStream } from "node:fs";
import fs from 'node:fs/promises'

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "*")
  res.setHeader("Access-Control-Allow-Methods", "*")

  if (req.method === "GET") {
    let [url, _query] = req.url.split("?"); 
    url = decodeURIComponent(url);
  
    if (url === "/favicon.ico") return res.end("No favicon")
  
    const rootFolder = url === "/"
    const rootUrl = `./storage${url}`;
  
    const queryParams = {};
    _query?.split("&").forEach((pair) => {
      const [key, value] = pair.split("=")
      queryParams[key] = value;
    })
  
    try {
      // checks if path exists 
      const stats = await fs.stat(rootUrl);
  
      // checks if it is a directory and maps all the files in it 
      if (stats.isDirectory()) {
        // withFileTypes returns dirent objects(which tells the name of the entry and if it is a folder)
        const entries = await readdir(rootUrl, { withFileTypes: true });
        const filesInDIR = entries.map(entry => ({
          name: entry.name,
          isDirectory: entry.isDirectory()
        }));

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(filesInDIR));
      } else {
        const fileHandle = await open(rootUrl);
        const mimeType = mime.lookup(rootUrl) || "application/octet-stream";
        const isInline = queryParams?.action != "download";
  
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Content-Disposition", isInline ? "inline" : "attachment");
  
        const readStream = fileHandle.createReadStream(); // reads file data in chunks
        readStream.pipe(res); // connects readable to writable stream;
        res.on('finish', () => fileHandle.close());
      }
    } catch (error) {
      console.error(error.message)
      res.end(JSON.stringify("Not found"))
    }
  } else if (req.method === "OPTIONS") {
    res.end("OK")
  } else if (req.method === "POST") {
      const [url] = req.url.split("?");
      const destination = `./storage${decodeURIComponent(url)}/${req.headers.filename}`.replace('//', '/');
      const writeStream = createWriteStream(destination)
      let count = 0
      req.on("data", (chunk) => {
        writeStream.write(chunk)
      })
      req.on('end', () => {
        writeStream.end()
        res.end("file uploaded to server")
      })
  } else if (req.method === "PATCH") {
    req.on("data", async (chunk) => {
      try {
        const data = JSON.parse(chunk.toString())
        console.log(data)
        const originalPath = `./storage${data.currentPath}/${data.originalName}`
        const fileExtension = data.originalName.split(".").pop()
        const newPath = `./storage${data.currentPath}/${data.renameText}.${fileExtension}`
        await fs.rename(originalPath, newPath)
        res.end("File name changed")
      } catch (error) {
        res.statusCode = 500
        res.end("Rename failed")
      }
    })
  } else if (req.method === "DELETE") {
    req.on("data", async (chunk) => {
      try {
        const data = JSON.parse(chunk.toString());
        const target = `./storage${data.path}/${data.filename}`.replace('//', '/');
        await fs.rm(target, { recursive: true });
        res.end("File deleted from the server")
      } catch (error) {
        res.statusCode = 500;
        res.end("Delete failed");
      }
    });
  }
})

server.listen(4000, () => {
  console.log("Listening on PORT 4000");
})