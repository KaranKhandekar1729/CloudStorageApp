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
      const fileHandle = await open(rootUrl);
      const stats = await fileHandle.stat();
  
      if (stats.isDirectory()) {
        // const path = url.split("/")
        // const currentFolder = rootFolder ? "Storage" : path[path.length - 1];
  
        const filesInDIR = await readdir(rootUrl);
  
        
        // let endRes = `<h1>Storage App</h1><h2>Current folder: ${currentFolder}</h2><h3>Files: </h3>`;
        
        // filesInDIR.forEach((file) => {
        //   const link = (rootFolder ? "" : url + "/") + encodeURIComponent(file);
        //   endRes += `${file} <a href=${link + "?action=open"}>Open</a>\t<a href=${link + "?action=download"}>Download</a><br>`;
        // });
        
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(filesInDIR));
      } else {
        const mimeType = mime.lookup(rootUrl) || "application/octet-stream";
        const open = queryParams?.action != "download";
  
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Content-Disposition", open ? "inline" : "attachment");
  
        const readStream = fileHandle.createReadStream(rootUrl); // reads file data in chunks
        readStream.pipe(res); // connects readable to writable stream;
  
        // ^ This is basically this V
        // readStream.on("data", (chunk) => {
        //   res.write(chunk);
        // });
  
        // readStream.on("end", () => {
        //   res.end();
        // });
      }
    } catch (error) {
      console.error(error.message)
      res.end(JSON.stringify("Not found"))
    }
  } else if (req.method === "OPTIONS") {
    res.end("OK")
  } else if (req.method === "POST") {
      const writeStream = createWriteStream(`./storage/${req.headers.filename}`)
      let count = 0
      req.on("data", (chunk) => {
        console.log(count++)
        writeStream.write(chunk)
      })
      req.on('end', () => {
        writeStream.end()
        res.end("file uploaded to server")
      })
  } else if (req.method === "PATCH") {
    req.on("data", (chunk) => {
        const data = JSON.parse(chunk.toString())
        console.log(data)
        const originalName = `./storage/${data.originalName}`
        const fileExtension = originalName.split(".").pop()
        const newName = `./storage/${data.renameText}.${fileExtension}`
        fs.rename(originalName, newName)
        res.end("File name changed")
    })
  } else if (req.method === "DELETE") {
    req.on("data", async (chunk) => {
      try {
        const filename = chunk.toString()
        await fs.rm(`./storage/${filename}`)
        res.end("File deleted from the server")
      } catch (error) {
        res.end(error)
      }
    })
  }
})

server.listen(4000, '0.0.0.0', () => {
  console.log("Listening on PORT 4000");
})