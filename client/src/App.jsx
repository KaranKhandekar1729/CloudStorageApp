import { useState } from "react"
import { useEffect } from "react"


export default function App() {
  const [filesInDIR, setFilesInDIR] = useState([]);
  const [progress, setProgress] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [renameText, setRenameText] = useState('')

  const fetchFiles = async () => {
      const res = await fetch("http://localhost:4000/")
      const data = await res.json()
      console.log(data)
      setFilesInDIR(data)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleOnChange = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:4000/", true);
      xhr.setRequestHeader("filename", uploadedFile.name)
      xhr.onload = () => {
        console.log(xhr.responseText)
      };
      xhr.upload.onprogress = (e) => {
        const progress = ((e.loaded / e.total) * 100)
        setProgress(`${progress.toFixed(2)}%`)
      }
      xhr.onerror = () => {
        console.log("Upload failed")
      }

      xhr.send(uploadedFile);
      fetchFiles()
      setTimeout(() => {
        setProgress('')
      }, 2000)
  }

  const handleRename = async (originalName) => {
    const response = await fetch('http://localhost:4000/', {
      method: 'PATCH',
      headers: {
        "originalname": `${originalName}`,
        "newfilename": `${renameText}`
      }
    })

    const data = await response.text()
    console.log(data)
    setRenameText('')
    setRenamingFile(null)
    fetchFiles()
  }

  return (
    <>
      <h1>My Files</h1>
        {filesInDIR.map((file, index) => (    
          <div key={index}>
            {file}
            <button onClick={() => window.open(`http://localhost:4000/${file}?action=open`)}>Open</button>
            <button onClick={() => window.open(`http://localhost:4000/${file}?action=download`)}>Download</button>
            <button onClick={() => setRenamingFile(file)}>Rename</button>
            { renamingFile === file &&
              <>
                <input type="text" value={renameText} onChange={(e) => (setRenameText(e.target.value))} /> 
                <button onClick={() => handleRename(file)}>Save</button> 
              </>
            }
          </div>
        ))}

        <input type="file" onChange={(e) => handleOnChange(e)}/>
        {progress && <p>Progress: {progress}</p>}

    </>
  )
}