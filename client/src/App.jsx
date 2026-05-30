import { useState } from "react"
import { useEffect } from "react"


export default function App() {
  const URL = 'http://localhost:4000/'
  const [filesInDIR, setFilesInDIR] = useState([]);
  const [progress, setProgress] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [currentPath, setCurrentPath] = useState('')

  const fetchFiles = async (path = currentPath) => {
      const res = await fetch(`${URL}${path}`)
      const data = await res.json()
      console.log(data)
      setFilesInDIR(data)
  }

  useEffect(() => {
    fetchFiles(currentPath)
  }, [currentPath])

  const handleOnChange = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${URL}${currentPath}`, true);
      xhr.setRequestHeader("filename", uploadedFile.name)
      xhr.onload = () => {
        console.log(xhr.responseText)
        fetchFiles()
      };
      xhr.upload.onprogress = (e) => {
        const progress = ((e.loaded / e.total) * 100)
        setProgress(`${progress.toFixed(2)}%`)
      }
      xhr.onerror = () => {
        console.log("Upload failed")
      }

      xhr.send(uploadedFile);
      
      setTimeout(() => {
        setProgress('')
      }, 2000)
  }

  const handleRename = async (originalName) => {
    const response = await fetch(URL, {
      method: 'PATCH',
      body: JSON.stringify({originalName, renameText, currentPath})
    })

    const data = await response.text()
    console.log(data)
    setRenameText('')
    setRenamingFile(null)
    fetchFiles()
  }

  const handleDelete = async (filename) => {
    const response =  await fetch(URL, {
      method: 'DELETE',
      body: JSON.stringify({filename, path: currentPath})
    })

    const data = await response.text()
    console.log(data)
    fetchFiles()
  }

  return (
    <>
      <h1>My Files</h1>
        {currentPath && <button onClick={() => {
          const parts = currentPath.split('/');
          parts.pop();
          setCurrentPath(parts.join('/'));
        }}>Back</button>}
        {filesInDIR.map((file, index) => (    
          <div key={index}>
            {file.isDirectory ? '📁' : '📄'} {file.name}
            <button onClick={() => {
              if (file.isDirectory) setCurrentPath(prev => prev ? `${prev}/${file.name}` : file.name);
              else window.open(`${URL}${currentPath ? currentPath + '/' : ''}${file.name}?action=open`);
            }}>Open</button>
            <button onClick={() => window.open(`${URL}${currentPath ? currentPath + '/' : ''}${file.name}?action=download`)}>Download</button>
            <button onClick={() => setRenamingFile(file.name)}>Rename</button>
            <button onClick={() => handleDelete(file.name)}>Delete</button>
            { renamingFile === file.name &&
              <>
                <input type="text" value={renameText} onChange={(e) => (setRenameText(e.target.value))} /> 
                <button onClick={() => handleRename(file.name)}>Save</button> 
              </>
            }
          </div>
        ))}

        <input type="file" onChange={(e) => handleOnChange(e)}/>
        {progress && <p>Progress: {progress}</p>}

    </>
  )
}